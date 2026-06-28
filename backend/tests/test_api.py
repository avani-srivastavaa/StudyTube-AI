"""
Basic smoke tests — run with: pytest tests/ -v

These cover endpoints and pure functions that don't require live API keys.
Generation/extraction endpoints that call Gemini/YouTube/Supabase are
intentionally not exercised here since they need real credentials; see
README.md for manual testing instructions against a running server.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    # Set dummy env vars so Settings() doesn't fail on import
    os.environ.setdefault("GEMINI_API_KEY", "test-key")
    os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
    os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
    os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
    from main import app
    return TestClient(app)


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200


def test_extract_rejects_bad_url(client):
    res = client.post("/api/extract", json={"url": "not-a-youtube-url"})
    # Should fail gracefully with 422, not crash with 500
    assert res.status_code == 422


# ── Pure function tests (no network / API keys needed) ─────────────────────

def test_scale_clamps_and_interpolates():
    from services.ai_service import _scale
    assert _scale(500, low=3, high=12) == 3            # below floor word count
    assert _scale(50000, low=3, high=12) == 12          # above ceiling word count
    mid = _scale(10750, low=3, high=12, lo_words=1500, hi_words=20000)  # ~50% through range
    assert 6 <= mid <= 9


def test_output_budget_scales_with_length():
    from services.ai_service import _output_budget
    assert _output_budget(500) < _output_budget(5000) < _output_budget(15000) <= 8192


def test_parse_json_strips_markdown_fences():
    from services.ai_service import _parse_json
    text = '```json\n{"a": 1, "b": [1, 2, 3]}\n```'
    result = _parse_json(text)
    assert result == {"a": 1, "b": [1, 2, 3]}


def test_export_notes_txt_contains_sections():
    from utils.exporter import export_notes_txt
    notes = {
        "title": "Test Notes",
        "overview": "An overview.",
        "keyPoints": ["point one", "point two"],
        "sections": [{"heading": "Section A", "content": "content here", "bullets": ["b1", "b2"]}],
    }
    text = export_notes_txt(notes)
    assert "Test Notes" in text
    assert "point one" in text
    assert "Section A" in text
    assert "b1" in text
