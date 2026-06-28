"""
Database Service — Supabase (PostgreSQL)
Handles all reads/writes: users, videos, progress, achievements, quiz results, chat history.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Optional
from supabase import create_client, Client
from utils.config import settings


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DBService:

    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,  # service role key — never exposed to browser
        )

    # ── Helper ────────────────────────────────────────────────────────────────

    def _run(self, query):
        """Execute a supabase-py query synchronously (wrap in run_in_executor if async needed)."""
        return query.execute()

    # ── Users ─────────────────────────────────────────────────────────────────

    async def get_or_create_user(self, user_id: str, email: str, display_name: str = "") -> dict:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.table("users")
                .select("*")
                .eq("id", user_id)
                .maybe_single()
                .execute()
        )
        # maybe_single() returns None directly (not a response object with
        # .data=None) when zero rows match — checking result.data without
        # this guard crashes with "'NoneType' object has no attribute 'data'"
        # for every brand-new user, which is exactly the case this method
        # exists to handle.
        if result is not None and result.data:
            return result.data

        new_user = {
            "id": user_id,
            "email": email,
            "display_name": display_name or email.split("@")[0],
            "xp": 0,
            "level": 1,
            "streak": 0,
            "last_active": _now(),
            "created_at": _now(),
        }
        insert = await loop.run_in_executor(
            None,
            lambda: self.client.table("users").insert(new_user).execute()
        )
        return insert.data[0]

    async def update_user_xp(self, user_id: str, xp_delta: int) -> dict:
        loop = asyncio.get_event_loop()
        # maybe_single() returns None instead of raising when 0 rows match —
        # .single() would throw here, which is what caused the FK/500 errors
        # when a public.users row didn't exist yet.
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("users").select("xp").eq("id", user_id).maybe_single().execute()
        )
        if res is None or res.data is None:
            # Self-heal: row missing (e.g. get_or_create_user call failed transiently).
            await loop.run_in_executor(
                None,
                lambda: self.client.table("users").upsert(
                    {"id": user_id, "email": "", "xp": 0, "level": 1, "streak": 0,
                     "last_active": _now(), "created_at": _now()},
                    on_conflict="id", ignore_duplicates=True,
                ).execute()
            )
            current_xp = 0
        else:
            current_xp = res.data["xp"]

        new_xp = current_xp + xp_delta
        new_level = (new_xp // 100) + 1

        updated = await loop.run_in_executor(
            None,
            lambda: self.client.table("users")
                .update({"xp": new_xp, "level": new_level, "last_active": _now()})
                .eq("id", user_id)
                .execute()
        )
        return updated.data[0]

    async def update_streak(self, user_id: str) -> int:
        """Increment streak if user studied yesterday, reset if gap > 1 day."""
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("users")
                .select("streak, last_active")
                .eq("id", user_id)
                .single()
                .execute()
        )
        data = res.data
        last = datetime.fromisoformat(data["last_active"])
        now = datetime.now(timezone.utc)
        diff_days = (now.date() - last.date()).days

        if diff_days == 0:
            return data["streak"]  # Already counted today
        elif diff_days == 1:
            new_streak = data["streak"] + 1
        else:
            new_streak = 1  # Streak broken

        await loop.run_in_executor(
            None,
            lambda: self.client.table("users")
                .update({"streak": new_streak, "last_active": _now()})
                .eq("id", user_id)
                .execute()
        )
        return new_streak

    # ── Videos ────────────────────────────────────────────────────────────────

    async def save_video(self, user_id: str, video_id: str, metadata: dict, content: dict) -> dict:
        """
        Save analyzed video + generated content.

        MERGES with any existing saved row instead of overwriting it. This
        matters because each individual /generate/<type> endpoint calls this
        with just its own field (e.g. {"quiz": questions}) — a naive upsert
        that always writes every column would null out notes/flashcards/
        mindmap/etc. that were saved by an earlier call.
        """
        loop = asyncio.get_event_loop()

        existing = await loop.run_in_executor(
            None,
            lambda: self.client.table("videos").select("*").eq("id", video_id).maybe_single().execute()
        )
        prev = existing.data if existing is not None and existing.data else {}

        row = {
            "id": video_id,
            "user_id": user_id,
            "title": metadata.get("title") or prev.get("title"),
            "channel": metadata.get("channel") or prev.get("channel"),
            "duration": metadata.get("duration") or prev.get("duration"),
            "thumbnail": metadata.get("thumbnail") or prev.get("thumbnail"),
            "transcript": content.get("transcript") or prev.get("transcript", ""),
            "notes": content.get("notes", prev.get("notes")),
            "flashcards": content.get("flashcards", prev.get("flashcards")),
            "quiz": content.get("quiz", prev.get("quiz")),
            "mindmap": content.get("mindmap", prev.get("mindmap")),
            "interview_questions": content.get("interview_questions", prev.get("interview_questions")),
            "exam_sheet": content.get("exam_sheet", prev.get("exam_sheet")),
            "analyzed_at": _now(),
        }
        result = await loop.run_in_executor(
            None,
            lambda: self.client.table("videos").upsert(row).execute()
        )
        return result.data[0]

    async def get_video(self, video_id: str) -> Optional[dict]:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("videos")
                .select("*")
                .eq("id", video_id)
                .maybe_single()
                .execute()
        )
        return res.data if res is not None else None

    async def get_user_videos(self, user_id: str, limit: int = 20) -> list:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("videos")
                .select("id, title, channel, duration, thumbnail, analyzed_at")
                .eq("user_id", user_id)
                .order("analyzed_at", desc=True)
                .limit(limit)
                .execute()
        )
        return res.data or []

    # ── Progress ──────────────────────────────────────────────────────────────

    async def save_progress(self, user_id: str, video_id: str, updates: dict) -> dict:
        """Upsert learning progress for a video."""
        loop = asyncio.get_event_loop()
        row = {
            "user_id": user_id,
            "video_id": video_id,
            "updated_at": _now(),
            **updates,
        }
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("progress")
                .upsert(row, on_conflict="user_id,video_id")
                .execute()
        )
        return res.data[0]

    async def get_progress(self, user_id: str, video_id: str) -> Optional[dict]:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("progress")
                .select("*")
                .eq("user_id", user_id)
                .eq("video_id", video_id)
                .maybe_single()
                .execute()
        )
        return res.data if res is not None else None

    # ── Quiz Results ──────────────────────────────────────────────────────────

    async def save_quiz_result(self, user_id: str, video_id: str, score: int, total: int) -> dict:
        loop = asyncio.get_event_loop()
        row = {
            "user_id": user_id,
            "video_id": video_id,
            "score": score,
            "total": total,
            "percentage": round(score / total * 100),
            "taken_at": _now(),
        }
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("quiz_results").insert(row).execute()
        )
        return res.data[0]

    async def get_quiz_history(self, user_id: str, video_id: str) -> list:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("quiz_results")
                .select("score, total, percentage, taken_at")
                .eq("user_id", user_id)
                .eq("video_id", video_id)
                .order("taken_at", desc=True)
                .limit(10)
                .execute()
        )
        return res.data or []

    # ── Achievements ──────────────────────────────────────────────────────────

    async def unlock_achievement(self, user_id: str, badge_id: str, label: str) -> dict:
        """Idempotent badge unlock — ignores duplicates."""
        loop = asyncio.get_event_loop()
        row = {
            "user_id": user_id,
            "badge_id": badge_id,
            "label": label,
            "earned_at": _now(),
        }
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("achievements")
                .upsert(row, on_conflict="user_id,badge_id", ignore_duplicates=True)
                .execute()
        )
        return res.data[0] if res.data else row

    async def get_achievements(self, user_id: str) -> list:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("achievements")
                .select("badge_id, label, earned_at")
                .eq("user_id", user_id)
                .execute()
        )
        return res.data or []

    # ── Chat History ──────────────────────────────────────────────────────────

    async def save_chat_message(self, user_id: str, video_id: str, role: str, content: str) -> dict:
        loop = asyncio.get_event_loop()
        row = {
            "user_id": user_id,
            "video_id": video_id,
            "role": role,
            "content": content,
            "sent_at": _now(),
        }
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("chat_history").insert(row).execute()
        )
        return res.data[0]

    async def get_chat_history(self, user_id: str, video_id: str, limit: int = 50) -> list:
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.client.table("chat_history")
                .select("role, content, sent_at")
                .eq("user_id", user_id)
                .eq("video_id", video_id)
                .order("sent_at")
                .limit(limit)
                .execute()
        )
        return res.data or []

    # ── Analytics ─────────────────────────────────────────────────────────────

    async def get_user_stats(self, user_id: str) -> dict:
        loop = asyncio.get_event_loop()

        user_res, videos_res, quiz_res, achievements_res = await asyncio.gather(
            loop.run_in_executor(None, lambda: self.client.table("users").select("xp,level,streak").eq("id", user_id).single().execute()),
            loop.run_in_executor(None, lambda: self.client.table("videos").select("id", count="exact").eq("user_id", user_id).execute()),
            loop.run_in_executor(None, lambda: self.client.table("quiz_results").select("percentage").eq("user_id", user_id).execute()),
            loop.run_in_executor(None, lambda: self.client.table("achievements").select("badge_id", count="exact").eq("user_id", user_id).execute()),
        )

        quiz_scores = [r["percentage"] for r in (quiz_res.data or [])]
        avg_quiz = round(sum(quiz_scores) / len(quiz_scores)) if quiz_scores else 0

        return {
            "xp": user_res.data.get("xp", 0),
            "level": user_res.data.get("level", 1),
            "streak": user_res.data.get("streak", 0),
            "videos_analyzed": videos_res.count or 0,
            "quizzes_taken": len(quiz_scores),
            "avg_quiz_score": avg_quiz,
            "badges_earned": achievements_res.count or 0,
        }