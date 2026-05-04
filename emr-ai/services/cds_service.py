import os
import json
from openai import AsyncOpenAI
from fastapi import HTTPException

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CDS_SYSTEM_PROMPT = """You are a clinical decision support assistant for healthcare providers in the DRC (Democratic Republic of Congo).
Given a SOAP note from a patient consultation, provide concise clinical decision support.

Consider the local DRC context:
- High prevalence of malaria, typhoid, tuberculosis, HIV, malnutrition, and diarrheal disease
- Limited lab/imaging availability in many settings
- Follow WHO essential medicines list and DRC national treatment protocols

Return a JSON object with exactly these fields:
- differentials: array of objects, each with "diagnosis" (string) and "reasoning" (string), most likely first, max 5
- recommended_workup: array of strings — investigations to order
- treatment_plan: string — concise treatment recommendations
- red_flags: array of strings — warning signs requiring urgent escalation

Rules:
- Respond in the same language as the SOAP note (French if French, English if English)
- Be concise and clinically actionable
- Do not invent information not present in the SOAP note
- Return ONLY valid JSON — no markdown, no explanation

Return format:
{
  "differentials": [
    { "diagnosis": "...", "reasoning": "..." }
  ],
  "recommended_workup": ["..."],
  "treatment_plan": "...",
  "red_flags": ["..."]
}"""


async def get_cds_suggestions(soap: dict) -> dict:
    """Generate clinical decision support from a SOAP note."""
    soap_text = "\n".join([
        f"Subjective: {soap.get('subjective', '')}",
        f"Objective: {soap.get('objective', '')}",
        f"Assessment: {soap.get('assessment', '')}",
        f"Plan: {soap.get('plan', '')}",
    ])

    if not any(soap.get(k, "").strip() for k in ["subjective", "objective", "assessment", "plan"]):
        raise HTTPException(status_code=400, detail="SOAP note is empty")

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": CDS_SYSTEM_PROMPT},
                {"role": "user", "content": f"SOAP Note:\n\n{soap_text}"},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
            max_tokens=2000,
        )

        result = json.loads(response.choices[0].message.content)

        result.setdefault("differentials", [])
        result.setdefault("recommended_workup", [])
        result.setdefault("treatment_plan", "")
        result.setdefault("red_flags", [])

        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON for CDS")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CDS failed: {str(e)}")
