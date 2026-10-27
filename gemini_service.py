import json
import os
import re
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-flash-lite-latest")
_client = None
RETRY_WORDS = ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "overloaded", "high demand")


def _get_client():
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")
        _client = genai.Client(api_key=key)
    return _client


def _call(prompt: str, config=None) -> str:
    """Try the main model with retries, then the fallback model."""
    last_error = None
    for model in (MODEL, FALLBACK_MODEL):
        for attempt in range(3):
            try:
                resp = _get_client().models.generate_content(
                    model=model, contents=prompt, config=config
                )
                return resp.text or ""
            except Exception as e:  # noqa: BLE001
                last_error = e
                if any(w in str(e) for w in RETRY_WORDS):
                    time.sleep(2 * (attempt + 1))  # wait 2s, 4s, 6s
                    continue
                break  # other errors (bad key, 404): try the next model
    raise last_error


def ask_text(prompt: str) -> str:
    return _call(prompt)


def ask_json(prompt: str):
    raw = _call(
        prompt,
        types.GenerateContentConfig(response_mime_type="application/json"),
    ).strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.M).strip()
    return json.loads(raw)


PROMPTS = {
    "explain": lambda t, l, x: (
        f'You are EduGenie, a friendly tutor. Explain "{t}" for a {l} learner. Style: {x}. '
        'Use short paragraphs and end with a "Key takeaways" list of 3 bullets. '
        'Plain text only; use "-" for bullets.'
    ),
    "quiz": lambda t, l, x: (
        f'Create a {x} multiple-choice quiz on "{t}" for a {l} learner. Return ONLY JSON: '
        '[{"q":"...","options":["A","B","C","D"],"answer":0,"why":"one-sentence explanation"}] '
        "where answer is the index of the correct option."
    ),
    "plan": lambda t, l, x: (
        f'Create a {x} study plan to learn "{t}" at {l} level. For each day or week give a '
        'title line, 2-3 concrete activities and a quick self-check. Plain text; use "-" for bullets.'
    ),
    "cards": lambda t, l, x: (
        f'Create {x} of flashcards on "{t}" for a {l} learner. Return ONLY JSON: '
        '[{"front":"term or question","back":"concise answer"}].'
    ),
}
JSON_MODES = {"quiz", "cards"}


def generate(mode: str, topic: str, level: str, extra: str):
    if mode not in PROMPTS:
        raise ValueError("Unknown mode")
    prompt = PROMPTS[mode](topic, level, extra)
    if mode in JSON_MODES:
        return {"data": ask_json(prompt)}
    return {"text": ask_text(prompt)}
