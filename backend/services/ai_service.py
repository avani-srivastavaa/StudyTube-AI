"""
AI Service
Gemini-powered generation: notes, flashcards, quiz, mindmap, interview, exam, chat.

Uses the `google-genai` SDK (the unified, actively-maintained client). The
older `google-generativeai` package is fully deprecated by Google — see
https://github.com/google-gemini/deprecated-generative-ai-python — and is
no longer used anywhere in this file.

KEY DESIGN NOTE — Whole-video coverage:
Current Gemini flash-tier models support very large input context, which
comfortably fits even a 3+ hour lecture transcript (typically 25k-45k words).
So we NEVER truncate the transcript before generation — every prompt
receives the full transcript text. Output length and item counts (sections,
flashcards, quiz questions) are scaled to the transcript's length so a
10-minute clip and a 2-hour course both get proportionate, complete
coverage rather than a fixed small number of items biased toward the
opening minutes.
"""

import json
import re
import asyncio
from typing import Any
from google import genai
from google.genai import types
from utils.config import settings

# Current GA flash-tier model as of this writing. Google retires Gemini
# models on a roughly 2-4 month cadence (1.5 and 1.0 are already fully
# shut down) — if generation starts returning 404s again, check
# https://ai.google.dev/gemini-api/docs/models for the current name and
# update this one constant.
# Model choice matters a lot for free-tier quota headroom, not just
# capability. gemini-3.5-flash's free tier is capped at just 20 requests/day
# (GenerateRequestsPerDayPerProjectPerModel-FreeTier) — easy to exhaust with
# this app's pipeline (4 calls just for initial analysis, more for
# interview/exam/chat). gemini-2.5-flash-lite gets 1,000 requests/day and
# 15/minute on the free tier — by far the most generous allowance Google
# currently offers, and plenty capable for structured JSON generation like
# notes/flashcards/quizzes. If quota issues persist, check
# https://ai.google.dev/gemini-api/docs/rate-limits for current numbers —
# Google revises these periodically (they cut free quotas significantly in
# December 2025), and pick whichever model has the best free-tier RPD today.
MODEL_NAME = "gemini-2.5-flash-lite"


def _parse_json(text: str) -> Any:
    """
    Robust JSON parser — strips markdown fences, then finds wherever the
    JSON actually starts (an object `{` or an array `[`), using whichever
    bracket appears EARLIEST in the text. (A naive "check `{` first" approach
    breaks on every array-rooted response, e.g. `[{"a":1}]`, because it finds
    the `{` that's nested *inside* the array — at a later index than the
    array's own opening `[` — and incorrectly strips off that leading `[`.)
    """
    cleaned = re.sub(r"```json\s*", "", text)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()
    candidates = [i for i in (cleaned.find("{"), cleaned.find("[")) if i != -1]
    if candidates:
        cleaned = cleaned[min(candidates):]
    return json.loads(cleaned)


def _word_count(text: str) -> int:
    return len(text.split())


def _scale(wc: int, low: int, high: int, lo_words: int = 1500, hi_words: int = 20000) -> int:
    """Linearly scale an item count between `low` and `high` based on transcript
    word count, clamped at the ends. Used so longer videos get proportionally
    more sections/flashcards/questions instead of a fixed count."""
    if wc <= lo_words:
        return low
    if wc >= hi_words:
        return high
    frac = (wc - lo_words) / (hi_words - lo_words)
    return round(low + frac * (high - low))


def _output_budget(wc: int) -> int:
    """Output token budget scales with transcript length so the model has
    room to cover later chapters, not just the introduction."""
    if wc < 2000:
        return 3000
    if wc < 8000:
        return 5000
    if wc < 20000:
        return 7000
    return 8192


COVERAGE_INSTRUCTION = (
    "IMPORTANT: The transcript below is the FULL, complete text of the video from "
    "start to finish — not an excerpt. Your output MUST draw from and represent "
    "content across the ENTIRE transcript (beginning, middle, AND end), in "
    "rough proportion to how much of the video each part occupies. Do not "
    "concentrate only on the introduction — if the transcript has 5 distinct "
    "topics spread evenly through it, your output should reflect all 5, not "
    "just the first 1-2."
)


def _extract_retry_delay(error: Exception, default: float) -> float:
    """
    Google's 429/503 errors include an exact wait time, e.g.
    "Please retry in 3.48589028s" or a structured retryDelay: '3s'. Use that
    instead of guessing — guessing shorter than the real quota window just
    guarantees a second failure.
    """
    text = str(error)
    m = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s", text)
    if not m:
        m = re.search(r"retry in (\d+(?:\.\d+)?)s", text)
    if m:
        return float(m.group(1)) + 0.5  # small buffer past the exact boundary
    return default


class AIService:

    # Transient, retry-worthy failure signatures. 503/UNAVAILABLE means
    # Google's servers are temporarily overloaded; 429/RESOURCE_EXHAUSTED
    # means a rate limit was hit. Both are usually gone within a few seconds
    # — for 429 specifically, the error tells us exactly how long (see
    # _extract_retry_delay above), which we now respect instead of guessing.
    _RETRYABLE_MARKERS = ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")
    _MAX_RETRIES = 4
    _BASE_DELAY = 2.0  # fallback only, used when no retryDelay is present in the error

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def _generate_json(self, prompt: str, max_tokens: int) -> str:
        loop = asyncio.get_event_loop()

        def _call():
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.6,
                    max_output_tokens=max_tokens,
                    response_mime_type="application/json",
                ),
            )
            return response.text

        last_error = None
        for attempt in range(self._MAX_RETRIES + 1):
            try:
                return await loop.run_in_executor(None, _call)
            except Exception as e:
                last_error = e
                is_retryable = any(m in str(e) for m in self._RETRYABLE_MARKERS)
                if not is_retryable or attempt == self._MAX_RETRIES:
                    raise
                fallback = self._BASE_DELAY * (2 ** attempt)
                delay = _extract_retry_delay(e, fallback)
                await asyncio.sleep(delay)
        raise last_error  # pragma: no cover — unreachable, satisfies type checkers

    # ── Notes ──────────────────────────────────────────────────────────────────

    async def generate_notes(self, transcript: str) -> dict:
        wc = _word_count(transcript)
        n_sections = _scale(wc, low=3, high=12)
        n_keypoints = _scale(wc, low=4, high=10)
        budget = _output_budget(wc)

        prompt = f"""You are an expert study notes creator.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Generate comprehensive, structured study notes covering the entire video.

Return ONLY valid JSON in this exact format:
{{
  "title": "concise descriptive title for the whole video",
  "overview": "3-4 sentence summary of everything covered, start to finish",
  "keyPoints": [{n_keypoints} key insights, one string each, spanning the full video],
  "sections": [
    {{
      "heading": "Section Heading reflecting a distinct topic/chapter",
      "content": "2-3 sentence explanation of this section",
      "bullets": ["important sub-point", "important sub-point", "important sub-point"]
    }}
  ]
}}

Generate approximately {n_sections} sections, ordered to follow the video's progression from
beginning to end. Each section should correspond to a genuinely distinct topic or chapter —
do not pad with repetitive sections, and do not skip later material to save space."""

        text = await self._generate_json(prompt, budget)
        return _parse_json(text)

    # ── Flashcards ─────────────────────────────────────────────────────────────

    async def generate_flashcards(self, transcript: str, count: int | None = None) -> list:
        wc = _word_count(transcript)
        n = count or _scale(wc, low=8, high=24)
        budget = _output_budget(wc)

        prompt = f"""You are a spaced-repetition flashcard expert.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Create {n} high-quality flashcards drawn from across the ENTIRE transcript — distribute
them proportionally across all topics covered, not just the opening section.

Return ONLY a JSON array:
[
  {{"front": "clear question or concept name", "back": "detailed answer with an example if possible"}}
]

Guidelines:
- Test understanding, not just memorization
- Include definitions, comparisons, and application questions
- Cover later/advanced topics as well as introductory ones
- Keep fronts concise, backs thorough"""

        text = await self._generate_json(prompt, budget)
        result = _parse_json(text)
        return result if isinstance(result, list) else result.get("flashcards", [])

    # ── Quiz ───────────────────────────────────────────────────────────────────

    async def generate_quiz(self, transcript: str, difficulty: str = "mixed", count: int | None = None) -> list:
        wc = _word_count(transcript)
        n = count or _scale(wc, low=6, high=18)
        budget = _output_budget(wc)

        prompt = f"""You are a quiz designer creating {difficulty} difficulty questions.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Generate {n} multiple-choice questions sampled across the WHOLE transcript — spread
questions roughly evenly from beginning to end, so someone who only watched the first
few minutes could NOT pass this quiz.

Return ONLY a JSON array:
[
  {{
    "question": "clear, specific question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "exact text of the correct option",
    "explanation": "why this answer is correct",
    "difficulty": "Easy|Medium|Hard"
  }}
]

Rules:
- correct MUST exactly match one of the options strings
- Distractors should be plausible but clearly wrong on reflection
- Mix conceptual, applied, and analytical questions
- Order questions to roughly follow the video's chronological progression"""

        text = await self._generate_json(prompt, budget)
        result = _parse_json(text)
        return result if isinstance(result, list) else result.get("questions", [])

    # ── Mind Map ───────────────────────────────────────────────────────────────

    async def generate_mindmap(self, transcript: str) -> dict:
        wc = _word_count(transcript)
        n_branches = _scale(wc, low=3, high=8)
        budget = _output_budget(wc)

        prompt = f"""You are a visual knowledge organizer.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Create a hierarchical mind map representing the ENTIRE video's structure.

Return ONLY a JSON object:
{{
  "label": "Main Topic (2-4 words)",
  "children": [
    {{
      "label": "Branch reflecting one major topic/chapter (2-4 words)",
      "children": [
        {{"label": "Leaf node (2-3 words)"}},
        {{"label": "Leaf node (2-3 words)"}}
      ]
    }}
  ]
}}

Create approximately {n_branches} main branches — one per major topic/chapter in the
video, in the order they occur — each with 2-5 children. Keep all labels SHORT
(2-4 words max). Branches must span the full video, including later/closing material."""

        text = await self._generate_json(prompt, budget)
        return _parse_json(text)

    # ── Interview Questions ────────────────────────────────────────────────────

    async def generate_interview_questions(self, transcript: str) -> list:
        wc = _word_count(transcript)
        n = _scale(wc, low=5, high=14)
        budget = _output_budget(wc)

        prompt = f"""You are a senior technical interviewer.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Generate {n} realistic interview questions sourced from across the ENTIRE video content,
spanning multiple difficulty levels.

Return ONLY a JSON array:
[
  {{
    "level": "Easy|Medium|Hard",
    "type": "Conceptual|Technical|Scenario|Behavioral",
    "question": "clear interview question",
    "answer": "detailed model answer (3-5 sentences)",
    "tip": "interviewer tip or follow-up to watch for"
  }}
]

Include a mix of levels and types, drawing on topics from throughout the video
(not only the introduction). Make questions feel like real interview scenarios."""

        text = await self._generate_json(prompt, budget)
        result = _parse_json(text)
        return result if isinstance(result, list) else result.get("questions", [])

    # ── Exam Sheet ─────────────────────────────────────────────────────────────

    async def generate_exam_sheet(self, transcript: str) -> dict:
        wc = _word_count(transcript)
        n_sections = _scale(wc, low=3, high=8)
        budget = _output_budget(wc)

        prompt = f"""You are an expert exam coach.

{COVERAGE_INSTRUCTION}

FULL TRANSCRIPT ({wc} words):
{transcript}

Generate a focused last-minute exam revision sheet covering the WHOLE video.

Return ONLY a JSON object:
{{
  "title": "Exam Revision: Topic Name",
  "examTips": ["actionable exam tip", "actionable exam tip", "actionable exam tip"],
  "sections": [
    {{
      "heading": "Section Name (one per major topic, in video order)",
      "mustKnow": ["essential concept", "essential concept", "essential concept"],
      "likelyQuestions": ["Likely exam question?", "Likely exam question?"],
      "quickFacts": ["memorable fact", "memorable fact"]
    }}
  ],
  "lastMinute": [
    "Most critical point 1", "Most critical point 2", "Most critical point 3",
    "Most critical point 4", "Most critical point 5"
  ]
}}

Generate approximately {n_sections} sections, one per major topic/chapter, ordered as
they appear in the video. Make sure later topics are covered as thoroughly as earlier
ones — do not let the sheet skew toward the introduction."""

        text = await self._generate_json(prompt, budget)
        return _parse_json(text)

    # ── RAG Chat ───────────────────────────────────────────────────────────────

    async def chat(self, messages: list[dict], context: str) -> str:
        """`context` is a set of semantically-retrieved chunks from across the
        FULL transcript (via RAGService), so answers can draw on any part of
        the video — not just the beginning. Stateless by design: the caller
        passes the whole message history every time, so we just translate it
        into Gemini's role/parts format and send one generate_content call."""
        system_instruction = f"""You are Nova, an enthusiastic and knowledgeable AI study tutor.

The following are the most relevant excerpts from the video transcript for the
user's current question (retrieved via semantic search over the FULL transcript):
---
{context}
---

Guidelines:
- Answer based primarily on the excerpts above
- Be encouraging, clear, and educational
- Use bullet points and structure for complex answers
- Give concrete examples when explaining concepts
- If the excerpts don't cover the question, say so honestly and help from general knowledge
- Keep responses focused and under 300 words unless detail is needed"""

        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
        ]

        loop = asyncio.get_event_loop()

        def _call():
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=1024,
                    system_instruction=system_instruction,
                ),
            )
            return response.text

        for attempt in range(self._MAX_RETRIES + 1):
            try:
                return await loop.run_in_executor(None, _call)
            except Exception as e:
                is_retryable = any(m in str(e) for m in self._RETRYABLE_MARKERS)
                if not is_retryable or attempt == self._MAX_RETRIES:
                    return f"Sorry, I hit a connection error ({e}). Please try again!"
                fallback = self._BASE_DELAY * (2 ** attempt)
                await asyncio.sleep(_extract_retry_delay(e, fallback))