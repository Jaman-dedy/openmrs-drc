import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from routers import scribe, cds

load_dotenv()

app = FastAPI(title="EMR AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scribe.router, prefix="/api/scribe", tags=["Ambient Scribe"])
app.include_router(cds.router, prefix="/api/cds", tags=["Clinical Decision Support"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "emr-ai"}


@app.get("/importmap.json")
async def importmap():
    """
    OpenMRS importmap entry for the ambient scribe frontend module.
    Register this URL in OpenMRS importmap-overrides for development.
    """
    return JSONResponse({
        "imports": {
            "@path-drc/esm-ambient-scribe-app": "/emr-ai/static/main.js"
        }
    })


# Serve the built frontend module — mounted last so API routes take priority
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
