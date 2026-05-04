from fastapi import APIRouter, UploadFile, File, Header, Form
from typing import Optional
from services.auth import extract_jsessionid, validate_openmrs_session
from services.whisper_service import transcribe_audio
from services.soap_builder import build_soap_note

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(..., description="Audio file from the browser (webm, mp3, wav, m4a)"),
    language: Optional[str] = Form(None, description="Hint: 'fr' or 'en'. Omit to auto-detect."),
    cookie: Optional[str] = Header(None),
):
    """
    Step 1 of the ambient scribe pipeline.
    Receives an audio recording and returns the raw transcript.
    """
    jsessionid = extract_jsessionid(cookie)
    await validate_openmrs_session(jsessionid)

    audio_bytes = await audio.read()
    result = await transcribe_audio(audio_bytes, audio.filename or "recording.webm", language)
    return result


@router.post("/structure")
async def structure_note(
    transcript: str = Form(..., description="Raw transcript text to convert to SOAP note"),
    cookie: Optional[str] = Header(None),
):
    """
    Step 2 of the ambient scribe pipeline.
    Converts a raw transcript into a structured SOAP note using GPT-4o.
    """
    jsessionid = extract_jsessionid(cookie)
    await validate_openmrs_session(jsessionid)

    soap = await build_soap_note(transcript)
    return soap


@router.post("/process")
async def process_recording(
    audio: UploadFile = File(..., description="Audio file from the browser"),
    language: Optional[str] = Form(None, description="Hint: 'fr' or 'en'. Omit to auto-detect."),
    cookie: Optional[str] = Header(None),
):
    """
    Full ambient scribe pipeline in a single call.
    Audio → Whisper transcript → GPT-4o SOAP note.
    Returns both the raw transcript and the structured note.
    """
    jsessionid = extract_jsessionid(cookie)
    await validate_openmrs_session(jsessionid)

    audio_bytes = await audio.read()

    transcription = await transcribe_audio(audio_bytes, audio.filename or "recording.webm", language)

    soap = await build_soap_note(transcription["transcript"])

    return {
        "transcript": transcription["transcript"],
        "language": transcription["language"],
        "duration_seconds": transcription.get("duration_seconds"),
        "soap": soap,
    }
