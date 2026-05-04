# EMR AI — Ambient Scribe & Clinical Decision Support

## What Was Built

Two AI-powered features integrated directly into the **PATH DRC OpenMRS 3.0 EMR**, accessible from the patient chart with no workflow disruption.

---

### Feature 1 — Ambient Scribe

A clinician opens the patient chart, clicks **Actions → Ambient Scribe**, and records the consultation in real time.

**The pipeline:**
1. Clinician clicks **Start Recording** — browser captures audio via microphone
2. Clinician speaks naturally with the patient (in French, English, or local language)
3. Clicks **Stop & Process**
4. Audio is sent to **OpenAI Whisper** for transcription (supports multilingual, auto-detects language)
5. Transcript is sent to **GPT-4o** which structures it into a **SOAP note** (Subjective, Objective, Assessment, Plan)
6. The structured note appears in the modal with per-section copy buttons and a full **Copy to Clipboard** for pasting into the encounter form

---

### Feature 2 — Clinical Decision Support (CDS)

After the SOAP note is generated, the clinician clicks **Get Clinical Suggestions**.

**GPT-4o analyzes the SOAP note and returns:**
- **Differential Diagnoses** — ranked list, each with clinical reasoning
- **Recommended Workup** — investigations to order
- **Treatment Plan** — concise treatment recommendations
- **Red Flags** — warning signs requiring urgent escalation

The AI prompt is tuned for the **DRC clinical context** — it accounts for high local prevalence of malaria, typhoid, TB, HIV, and malnutrition, and follows WHO/DRC treatment protocols.

---

### Technical Integration

| Layer | Technology |
|---|---|
| EMR | OpenMRS 3.0 (OpenMRS SPA / O3) |
| Frontend module | React + Carbon Design System, Module Federation |
| AI backend | FastAPI (Python), containerized |
| Speech-to-text | OpenAI Whisper |
| Clinical reasoning | OpenAI GPT-4o |
| Authentication | Passes OpenMRS session (JSESSIONID) — no separate login |
| Gateway | nginx reverse proxy — AI routes under `/openmrs/emr-ai/` |

---

### Demo Flow

1. Open any patient chart in OpenMRS
2. **Actions → Ambient Scribe**
3. Click **Start Recording**, speak the consultation, click **Stop & Process**
4. SOAP note appears automatically (~10–20 seconds depending on audio length)
5. Click **Get Clinical Suggestions** → differential diagnoses, workup, and treatment plan appear
6. Copy the note → paste into the OpenMRS encounter form

---

### What Is Not Yet Done (Next Steps)

- **Auto-save to OpenMRS** — write the SOAP note directly as an encounter/observations (no manual copy-paste)
- **Patient history context** — pass prior encounters to the CDS for richer suggestions
- **Local language support** — fine-tune Whisper for Lingala, Swahili, Tshiluba
- **Offline resilience** — queue recordings when connectivity is poor

---

*Built on OpenMRS 3.0 · Powered by OpenAI Whisper + GPT-4o · Deployable on-premise or cloud*
