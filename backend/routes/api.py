"""
API Routes — StudyTube AI (Supabase edition)
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()
logger = logging.getLogger("studytube.api")

# RAGService keeps an in-memory FAISS index per video_id. It MUST be a
# singleton shared across requests — instantiating a fresh RAGService() per
# request (as this used to do inside the /chat handler) resets that cache
# every time, so has_index() always returns False and the entire transcript
# gets re-embedded from scratch on every single chat message. That's both
# why chat was slow and why it was failing: repeated full-transcript
# embedding calls with no retry logic are exactly the kind of thing that
# trips a transient rate limit/503.
_rag_service = None

def _get_rag_service():
    global _rag_service
    if _rag_service is None:
        from services.rag_service import RAGService
        _rag_service = RAGService()
    return _rag_service


# ── Persistence helper ─────────────────────────────────────────────────────────

async def _safe_persist(coro, label: str):
    """
    Run a Supabase persistence call WITHOUT letting it break the actual
    feature (extraction / AI generation) that already succeeded.

    Common reasons this can fail even when everything else is fine:
      - supabase_schema.sql hasn't been run yet (tables don't exist — PGRST205)
      - RLS policy mismatch
      - transient network issue reaching Supabase

    Any of those should degrade to "this session just won't be saved" rather
    than surfacing as "couldn't analyze this video" to the user.
    """
    try:
        return await coro
    except Exception as e:
        logger.warning(f"Persistence skipped ({label}): {e}")
        return None


# ── Auth helper ───────────────────────────────────────────────────────────────

async def get_current_user(authorization: str = Header(None)) -> Optional[dict]:
    """
    Verify Supabase JWT and return user payload. Returns None if no token.

    Also guarantees a matching row exists in `public.users` before returning.
    The schema's trigger auto-creates that row on signup, but accounts created
    *before* supabase_schema.sql was run (or any other edge case where the
    trigger didn't fire) won't have one — and every other table has a foreign
    key to public.users, so any save would fail with a 23503 constraint error
    otherwise. This call is one extra cheap lookup per request; cheap insurance
    against an entire class of FK failures.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        from supabase import create_client
        from utils.config import settings
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        auth_user = client.auth.get_user(token)
        if not auth_user.user:
            return None
        user_dict = auth_user.user.__dict__

        from services.db_service import DBService
        await _safe_persist(
            DBService().get_or_create_user(
                user_id=user_dict["id"],
                email=user_dict.get("email") or "",
                display_name=(user_dict.get("user_metadata") or {}).get("full_name", ""),
            ),
            "get_or_create_user",
        )

        return user_dict
    except Exception as e:
        # Swallowing this silently made connection failures (e.g. a paused
        # Supabase free-tier project, network issues, an expired key) look
        # IDENTICAL to "not logged in" — every authenticated feature
        # (Continue Studying, XP, persistence) would just silently stop
        # working with zero indication why. Log it so that's diagnosable.
        logger.warning(f"get_current_user: token verification failed: {e!r}")
        return None


# ── Request Models ────────────────────────────────────────────────────────────

class VideoRequest(BaseModel):
    url: str
    language: str = "en"

class GenerateRequest(BaseModel):
    transcript: str
    video_id: str
    options: Optional[Dict[str, Any]] = {}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    video_id: str
    transcript: str

class ProgressUpdate(BaseModel):
    video_id: str
    notes_read: bool = False
    flashcards_mastered: int = 0
    quiz_score: Optional[int] = None
    quiz_total: Optional[int] = None

class XPUpdate(BaseModel):
    user_id: str
    xp_delta: int
    badge_id: Optional[str] = None
    badge_label: Optional[str] = None

class ExportRequest(BaseModel):
    content_type: str
    content: Dict[str, Any]


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok"}


# ── Transcript ────────────────────────────────────────────────────────────────

@router.post("/extract")
async def extract_transcript(req: VideoRequest, user=Depends(get_current_user)):
    from services.transcript_service import TranscriptService

    # Parse the video ID first — pure regex, no network — so we can check
    # the cache before doing any real work (transcript fetch, yt-dlp lookup).
    try:
        video_id = TranscriptService.extract_video_id(req.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    db = None
    if user:
        from services.db_service import DBService
        db = DBService()
        cached = None
        try:
            cached = await db.get_video(video_id)
        except Exception as e:
            logger.warning(f"Cache lookup failed (non-fatal, will re-analyze): {e}")

        if cached and cached.get("transcript"):
            cached["video_id"] = cached.get("id", video_id)
            cached["cached"] = True
            return cached

    # Not cached (or no logged-in user) — do the real extraction.
    try:
        result = await TranscriptService().extract(req.url, req.language)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    result["cached"] = False

    if user and db:
        await _safe_persist(
            db.save_video(
                user_id=user["id"],
                video_id=result["video_id"],
                metadata=result,
                content={"transcript": result["transcript"]},
            ),
            "save_video (extract)",
        )

    return result


# ── AI Generation ─────────────────────────────────────────────────────────────

@router.post("/generate/notes")
async def generate_notes(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        notes = await AIService().generate_notes(req.transcript)
    except Exception as e:
        logger.error(f"generate/notes failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"notes": notes}),
            "save_video (notes)",
        )

    return {"success": True, "data": notes}


@router.post("/generate/flashcards")
async def generate_flashcards(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        cards = await AIService().generate_flashcards(req.transcript, count=req.options.get("count", 12))
    except Exception as e:
        logger.error(f"generate/flashcards failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"flashcards": cards}),
            "save_video (flashcards)",
        )

    return {"success": True, "data": cards}


@router.post("/generate/quiz")
async def generate_quiz(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        questions = await AIService().generate_quiz(
            req.transcript,
            difficulty=req.options.get("difficulty", "mixed"),
            count=req.options.get("count", 8),
        )
    except Exception as e:
        logger.error(f"generate/quiz failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"quiz": questions}),
            "save_video (quiz)",
        )

    return {"success": True, "data": questions}


@router.post("/generate/mindmap")
async def generate_mindmap(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        tree = await AIService().generate_mindmap(req.transcript)
    except Exception as e:
        logger.error(f"generate/mindmap failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"mindmap": tree}),
            "save_video (mindmap)",
        )

    return {"success": True, "data": tree}


@router.post("/generate/interview")
async def generate_interview(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        questions = await AIService().generate_interview_questions(req.transcript)
    except Exception as e:
        logger.error(f"generate/interview failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"interview_questions": questions}),
            "save_video (interview)",
        )

    return {"success": True, "data": questions}


@router.post("/generate/exam")
async def generate_exam(req: GenerateRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService
        sheet = await AIService().generate_exam_sheet(req.transcript)
    except Exception as e:
        logger.error(f"generate/exam failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(user["id"], req.video_id, {}, {"exam_sheet": sheet}),
            "save_video (exam)",
        )

    return {"success": True, "data": sheet}


@router.post("/generate/all")
async def generate_all(req: GenerateRequest, user=Depends(get_current_user)):
    from services.ai_service import AIService
    svc = AIService()

    # Free-tier Gemini API keys are typically capped at just 5 requests per
    # minute per model (see the RESOURCE_EXHAUSTED errors this used to throw
    # constantly). Firing all four generation calls in parallel via
    # asyncio.gather guaranteed 3 of them would get rate-limited instantly,
    # no matter how good the retry logic was — the burst itself was the bug.
    # Running them one at a time with a gap between each keeps us
    # comfortably under that ceiling. This makes the whole pipeline take
    # longer (curr. ~45-60s instead of ~15s) but means it actually succeeds
    # on a free-tier key instead of failing 3 times out of 4.
    INTER_CALL_DELAY = 5  # seconds — gemini-2.5-flash-lite allows 15 req/min, this stays safely under it

    field_calls = [
        ("notes", svc.generate_notes),
        ("flashcards", svc.generate_flashcards),
        ("quiz", svc.generate_quiz),
        ("mindmap", svc.generate_mindmap),
    ]

    results = {}
    for i, (field, fn) in enumerate(field_calls):
        try:
            results[field] = await fn(req.transcript)
        except Exception as e:
            logger.error(f"generate/all: '{field}' failed: {e!r}", exc_info=e)
            results[field] = e
        if i < len(field_calls) - 1:
            await asyncio.sleep(INTER_CALL_DELAY)

    if user:
        from services.db_service import DBService
        await _safe_persist(
            DBService().save_video(
                user_id=user["id"],
                video_id=req.video_id,
                metadata={},
                content={k: v for k, v in results.items() if not isinstance(v, Exception)},
            ),
            "save_video (generate/all)",
        )

    return {
        "success": True,
        **{k: (v if not isinstance(v, Exception) else None) for k, v in results.items()},
        "errors": [str(v) for v in results.values() if isinstance(v, Exception)],
        "field_errors": {k: (str(v) if isinstance(v, Exception) else None) for k, v in results.items()},
    }


# ── Chat ──────────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    try:
        from services.ai_service import AIService

        rag = _get_rag_service()
        if not rag.has_index(req.video_id):
            await rag.build_index(req.video_id, req.transcript)

        chunks = await rag.search(req.video_id, req.messages[-1].content, k=4)
        reply = await AIService().chat(
            messages=[{"role": m.role, "content": m.content} for m in req.messages],
            context="\n\n".join(chunks),
        )
    except Exception as e:
        logger.error(f"chat failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))

    if user:
        from services.db_service import DBService
        db = DBService()
        last_user_msg = req.messages[-1]
        await _safe_persist(
            asyncio.gather(
                db.save_chat_message(user["id"], req.video_id, last_user_msg.role, last_user_msg.content),
                db.save_chat_message(user["id"], req.video_id, "assistant", reply),
            ),
            "save_chat_message",
        )

    return {"success": True, "reply": reply}


@router.get("/chat/history/{video_id}")
async def get_chat_history(video_id: str, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    from services.db_service import DBService
    history = await DBService().get_chat_history(user["id"], video_id)
    return {"success": True, "data": history}


# ── Progress & XP ─────────────────────────────────────────────────────────────
# These two endpoints ARE persistence — a failure here is a real error, not
# something to swallow, so they keep their original try/except behavior.

@router.post("/progress/update")
async def update_progress(req: ProgressUpdate, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        from services.db_service import DBService
        db = DBService()
        updates = {
            "notes_read": req.notes_read,
            "flashcards_mastered": req.flashcards_mastered,
        }
        if req.quiz_score is not None:
            await db.save_quiz_result(user["id"], req.video_id, req.quiz_score, req.quiz_total or 1)
            updates["last_quiz_score"] = req.quiz_score
        progress = await db.save_progress(user["id"], req.video_id, updates)
        return {"success": True, "data": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/xp/earn")
async def earn_xp(req: XPUpdate, user=Depends(get_current_user)):
    # Depending on get_current_user (even though req.user_id is what's actually
    # credited) ensures the public.users row exists before update_user_xp runs —
    # same FK-safety guarantee every other authenticated endpoint gets.
    try:
        from services.db_service import DBService
        db = DBService()
        updated = await db.update_user_xp(req.user_id, req.xp_delta)
        if req.badge_id and req.badge_label:
            await db.unlock_achievement(req.user_id, req.badge_id, req.badge_label)
        return {"success": True, "data": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── User Data ─────────────────────────────────────────────────────────────────

@router.get("/user/stats")
async def get_user_stats(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    from services.db_service import DBService
    stats = await DBService().get_user_stats(user["id"])
    return {"success": True, "data": stats}


@router.get("/user/videos")
async def get_user_videos(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        from services.db_service import DBService
        videos = await DBService().get_user_videos(user["id"])
        return {"success": True, "data": videos}
    except Exception as e:
        logger.error(f"user/videos failed: {e!r}", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video/{video_id}")
async def get_video_full(video_id: str, user=Depends(get_current_user)):
    """Fetch one previously-analyzed video's full saved content (transcript +
    notes/flashcards/quiz/mindmap) — used to resume studying a video without
    re-running extraction or AI generation. Scoped to the current user via
    save_video's user_id, same as the rest of the cache."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    from services.db_service import DBService
    video = await DBService().get_video(video_id)
    if not video or video.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Video not found in your library")
    video["cached"] = True
    return {"success": True, "data": video}


@router.get("/user/achievements")
async def get_achievements(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    from services.db_service import DBService
    badges = await DBService().get_achievements(user["id"])
    return {"success": True, "data": badges}


# ── Export ────────────────────────────────────────────────────────────────────

@router.post("/export")
async def export_content(req: ExportRequest):
    try:
        import base64
        from utils.exporter import export_notes_txt, export_flashcards_txt, export_quiz_txt
        exporters = {
            "notes": export_notes_txt,
            "flashcards": export_flashcards_txt,
            "quiz": export_quiz_txt,
        }
        fn = exporters.get(req.content_type)
        if not fn:
            raise HTTPException(status_code=400, detail=f"Unknown content type: {req.content_type}")
        text = fn(req.content)
        return {
            "success": True,
            "filename": f"studytube_{req.content_type}.txt",
            "data": base64.b64encode(text.encode()).decode(),
            "encoding": "base64",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))