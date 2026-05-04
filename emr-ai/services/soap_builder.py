import os
import json
from openai import AsyncOpenAI
from fastapi import HTTPException

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SOAP_SYSTEM_PROMPT = """You are a clinical documentation assistant for a hospital in the DRC (Democratic Republic of Congo).
Your task is to extract and structure clinical information from a conversation transcript between a healthcare provider and a patient.

Extract and return a structured SOAP note in JSON format with these exact fields:
- subjective: Chief complaint and symptoms reported by the patient (anamnèse / plaintes)
- objective: Physical examination findings and vital signs mentioned during the consultation
- assessment: Diagnosis or differential diagnoses mentioned by the provider
- plan: Treatment, medications prescribed, investigations ordered, follow-up instructions

Rules:
- Preserve the language of the original transcript (respond in French if the transcript is French, English if English)
- If a section has no information in the transcript, return an empty string ""
- Do not invent or assume any clinical information not explicitly present in the transcript
- Be concise and clinically accurate
- Return ONLY valid JSON — no markdown, no explanation, no extra text

Return format:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}"""


async def build_soap_note(transcript: str) -> dict:
    """Convert a raw clinical transcript into a structured SOAP note."""
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SOAP_SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n\n{transcript}"},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
            max_tokens=1500,
        )

        content = response.choices[0].message.content
        soap = json.loads(content)

        for field in ["subjective", "objective", "assessment", "plan"]:
            if field not in soap:
                soap[field] = ""

        return soap

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON for SOAP note")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SOAP structuring failed: {str(e)}")
