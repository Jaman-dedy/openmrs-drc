import os
import httpx
from fastapi import HTTPException

OPENMRS_URL = os.getenv("OPENMRS_URL", "http://backend:8080")


def extract_jsessionid(cookie_header: str | None) -> str:
    if not cookie_header:
        raise HTTPException(status_code=401, detail="No session cookie provided")
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith("JSESSIONID="):
            return part.split("=", 1)[1]
    raise HTTPException(status_code=401, detail="JSESSIONID not found in cookie")


async def validate_openmrs_session(jsessionid: str) -> dict:
    """Validate the OpenMRS session and return session info."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{OPENMRS_URL}/openmrs/ws/rest/v1/session",
                cookies={"JSESSIONID": jsessionid},
                timeout=5.0,
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=503, detail="OpenMRS is unreachable")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"OpenMRS connection error: {e}")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    data = response.json()
    if not data.get("authenticated"):
        raise HTTPException(status_code=401, detail="Session is not authenticated")

    return data
