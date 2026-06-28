"""
RAG Service
Builds and queries a FAISS vector store per video for context-aware chat.

Embeddings are called directly via the `google-genai` SDK (not through
LangChain's GoogleGenerativeAIEmbeddings wrapper, which is built on the now
fully-deprecated `google-generativeai` package). A tiny adapter class below
gives FAISS the two methods it actually needs (`embed_documents`,
`embed_query`) backed by the current SDK.
"""

import asyncio
import time
from typing import Optional
from google import genai
from google.genai import types
from langchain_core.embeddings import Embeddings
from langchain_community.vectorstores import FAISS
from utils.config import settings

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768  # smaller than the 3072 default — plenty for semantic search, much faster

_RETRYABLE_MARKERS = ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")
_MAX_RETRIES = 4
_BASE_DELAY = 2.0  # fallback only, used when no retryDelay is present in the error


def _extract_retry_delay(error: Exception, default: float) -> float:
    """Same logic as ai_service.py's helper — Google's 429 errors specify an
    exact wait time; respect it instead of guessing shorter and failing again."""
    import re
    text = str(error)
    m = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)s", text)
    if not m:
        m = re.search(r"retry in (\d+(?:\.\d+)?)s", text)
    if m:
        return float(m.group(1)) + 0.5
    return default


class _GeminiEmbeddings(Embeddings):
    """
    LangChain-compatible embeddings adapter backed directly by the
    google-genai SDK. Subclasses langchain_core.embeddings.Embeddings (rather
    than being a plain duck-typed class) deliberately — some LangChain
    vectorstore code paths do `isinstance(embedding, Embeddings)` and fall
    back to treating the object as a raw callable (`embedding(texts)`) if
    that check fails, which raised "object is not callable" here.
    """

    def __init__(self, client: "genai.Client"):
        self._client = client

    def _embed(self, texts: list[str]) -> list[list[float]]:
        last_error = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response = self._client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=texts,
                    config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
                )
                return [e.values for e in response.embeddings]
            except Exception as e:
                last_error = e
                is_retryable = any(m in str(e) for m in _RETRYABLE_MARKERS)
                if not is_retryable or attempt == _MAX_RETRIES:
                    raise
                time.sleep(_extract_retry_delay(e, _BASE_DELAY * (2 ** attempt)))
        raise last_error  # pragma: no cover — unreachable

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text])[0]


class RAGService:

    def __init__(self):
        self._stores: dict[str, FAISS] = {}
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self._embeddings = _GeminiEmbeddings(self._client)

    def has_index(self, video_id: str) -> bool:
        return video_id in self._stores

    async def build_index(self, video_id: str, transcript: str) -> None:
        """Chunk transcript and build a FAISS index. Chunk size is on the
        larger side (1200 chars) so building an index for a long transcript
        needs fewer embedding API calls — directly addresses the "this is
        slow" complaint without losing meaningful retrieval granularity."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,
            chunk_overlap=150,
            separators=["\n\n", "\n", ". ", " "],
        )
        chunks = splitter.split_text(transcript)

        loop = asyncio.get_event_loop()
        store = await loop.run_in_executor(
            None,
            lambda: FAISS.from_texts(chunks, self._embeddings),
        )
        self._stores[video_id] = store

    async def search(self, video_id: str, query: str, k: int = 4) -> list[str]:
        """Semantic similarity search — returns top-k relevant chunks."""
        if video_id not in self._stores:
            raise ValueError(f"No index found for video {video_id}. Call build_index first.")

        store = self._stores[video_id]
        loop = asyncio.get_event_loop()
        docs = await loop.run_in_executor(
            None,
            lambda: store.similarity_search(query, k=k),
        )
        return [doc.page_content for doc in docs]

    def clear_index(self, video_id: str) -> None:
        self._stores.pop(video_id, None)

    def clear_all(self) -> None:
        self._stores.clear()

    @property
    def indexed_videos(self) -> list[str]:
        return list(self._stores.keys())