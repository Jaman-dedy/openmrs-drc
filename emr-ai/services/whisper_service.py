import os
from openai import AsyncOpenAI
from fastapi import HTTPException

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SUPPORTED_LANGUAGES = {"fr", "en"}
MAX_FILE_SIZE_MB = 25


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    language: str | None = None,
) -> dict:
    """Send audio to OpenAI Whisper and return the transcript."""
    size_mb = len(audio_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file exceeds {MAX_FILE_SIZE_MB}MB limit ({size_mb:.1f}MB received)",
        )

    if language and language not in SUPPORTED_LANGUAGES:
        language = None

    # Detect mime type from filename extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    mime_map = {
        "webm": "audio/webm",
        "mp4": "audio/mp4",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "m4a": "audio/mp4",
    }
    mime_type = mime_map.get(ext, "audio/webm")

    try:
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, mime_type),
            response_format="verbose_json",
            **( {"language": language} if language else {} ),
        )
        return {
            "transcript": response.text,
            "language": getattr(response, "language", language or "unknown"),
            "duration_seconds": getattr(response, "duration", None),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
