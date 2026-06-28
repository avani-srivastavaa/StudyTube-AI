"""
Transcript Service
Fetches YouTube transcripts, cleans them, and chunks for RAG.
"""

import re
import asyncio
from typing import Any
from youtube_transcript_api import YouTubeTranscriptApi
try:
    from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
except ImportError:
    from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
import yt_dlp

# youtube-transcript-api v1.x rewrote the whole API: the old class-level
# YouTubeTranscriptApi.get_transcript(...) / .list_transcripts(...) became
# instance methods YouTubeTranscriptApi().fetch(...) / .list(...), and fetch()
# now returns an iterable of snippet OBJECTS (".text" attribute) instead of
# a list of dicts ("entry['text']"). We detect which generation is installed
# once, so the rest of this file works unmodified across both.
_NEW_TRANSCRIPT_API = not hasattr(YouTubeTranscriptApi, "get_transcript")


class TranscriptService:

    @staticmethod
    def extract_video_id(url: str) -> str:
        """Public + static so callers (e.g. a cache check in routes/api.py)
        can get the video ID without instantiating the service or doing any
        network work — this is pure regex, no I/O."""
        patterns = [
            r"(?:v=|youtu\.be/|embed/|shorts/|live/)([a-zA-Z0-9_-]{11})",
        ]
        for p in patterns:
            m = re.search(p, url)
            if m:
                return m.group(1)
        # Bare video ID pasted directly (no URL wrapper)
        if re.fullmatch(r"[a-zA-Z0-9_-]{11}", url.strip()):
            return url.strip()
        raise ValueError(f"Could not extract video ID from URL: {url}")

    def _extract_video_id(self, url: str) -> str:
        return self.extract_video_id(url)

    def _get_video_metadata(self, video_id: str) -> dict:
        """Use yt-dlp to fetch video title, channel, duration."""
        ydl_opts = {"quiet": True, "skip_download": True, "extract_flat": True}
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
                duration_sec = info.get("duration", 0)
                mins, secs = divmod(duration_sec, 60)
                hrs, mins = divmod(mins, 60)
                duration_str = f"{hrs}:{mins:02d}:{secs:02d}" if hrs else f"{mins}:{secs:02d}"
                return {
                    "title": info.get("title", "Untitled Video"),
                    "channel": info.get("uploader", "Unknown Channel"),
                    "duration": duration_str,
                    "views": f"{info.get('view_count', 0):,} views",
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                }
        except Exception:
            return {
                "title": "YouTube Video",
                "channel": "Unknown",
                "duration": "Unknown",
                "views": "N/A",
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            }

    def _clean_transcript(self, entries: list) -> str:
        """Join transcript entries into clean text, removing noise."""
        raw = " ".join(e["text"] for e in entries)
        raw = re.sub(r"\[.*?\]", "", raw)       # Remove [Music], [Applause], etc.
        raw = re.sub(r"\s+", " ", raw).strip()  # Normalize whitespace
        return raw

    def _chunk_transcript(self, text: str) -> list[str]:
        """Split transcript into overlapping chunks for RAG."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " "],
        )
        return splitter.split_text(text)

    @staticmethod
    def _normalize_entries(fetched) -> list:
        """Turn either old-style list[dict] entries or new-style FetchedTranscript
        (iterable of snippet objects with a .text attribute) into list[dict]."""
        entries = []
        for item in fetched:
            if isinstance(item, dict):
                entries.append({"text": item.get("text", "")})
            else:
                entries.append({"text": getattr(item, "text", "")})
        return entries

    def _fetch_transcript_entries(self, video_id: str, language: str) -> list:
        """
        Try, in order:
          1. The requested language, then English (fast path — most videos)
          2. ANY manually-created or auto-generated track, translated to
             English if possible, otherwise returned in its original language
        Raises a clear, specific ValueError if every option is exhausted.
        Works with both youtube-transcript-api v0.x (static methods) and
        v1.x+ (instance methods) automatically.
        """
        if _NEW_TRANSCRIPT_API:
            api = YouTubeTranscriptApi()
            fetch_fn = lambda vid, langs: api.fetch(vid, languages=langs)
            list_fn = lambda vid: api.list(vid)
        else:
            fetch_fn = lambda vid, langs: YouTubeTranscriptApi.get_transcript(vid, languages=langs)
            list_fn = lambda vid: YouTubeTranscriptApi.list_transcripts(vid)

        try:
            return self._normalize_entries(fetch_fn(video_id, [language, "en"]))
        except (TranscriptsDisabled, NoTranscriptFound):
            pass
        except Exception:
            pass  # fall through to the broader search below

        try:
            transcript_list = list_fn(video_id)
        except TranscriptsDisabled:
            raise ValueError("Captions are disabled for this video.")
        except Exception as e:
            raise ValueError(f"Could not retrieve this video (it may be private, age-restricted, or removed): {e}")

        available = list(transcript_list)
        if not available:
            raise ValueError("This video has no captions in any language.")

        for t in available:
            if t.language_code.startswith("en"):
                return self._normalize_entries(t.fetch())
        for t in available:
            if t.is_translatable:
                try:
                    return self._normalize_entries(t.translate("en").fetch())
                except Exception:
                    continue
        return self._normalize_entries(available[0].fetch())

    async def extract(self, url: str, language: str = "en") -> dict[str, Any]:
        video_id = self._extract_video_id(url)
        loop = asyncio.get_event_loop()

        entries = await loop.run_in_executor(None, lambda: self._fetch_transcript_entries(video_id, language))

        transcript_text = self._clean_transcript(entries)
        chunks = self._chunk_transcript(transcript_text)
        metadata = await loop.run_in_executor(None, lambda: self._get_video_metadata(video_id))

        return {
            "video_id": video_id,
            "transcript": transcript_text,
            "chunks": chunks,
            **metadata,
        }