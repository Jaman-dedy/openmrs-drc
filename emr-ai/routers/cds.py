from fastapi import APIRouter, Header
from typing import Optional
from pydantic import BaseModel
from services.auth import extract_jsessionid, validate_openmrs_session
from services.cds_service import get_cds_suggestions

router = APIRouter()


class SoapNoteInput(BaseModel):
    subjective: str = ""
    objective: str = ""
    assessment: str = ""
    plan: str = ""


@router.post("/suggest")
async def suggest(
    soap: SoapNoteInput,
    cookie: Optional[str] = Header(None),
):
    """
    Clinical Decision Support endpoint.
    Accepts a SOAP note and returns differential diagnoses,
    recommended workup, treatment plan, and red flags.
    """
    jsessionid = extract_jsessionid(cookie)
    await validate_openmrs_session(jsessionid)

    return await get_cds_suggestions(soap.model_dump())
