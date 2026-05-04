# ── Stage 1: Build the React frontend module ──────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY emr-ai-frontend/package*.json ./
RUN npm ci --quiet
COPY emr-ai-frontend/ ./
RUN npm run build

# ── Stage 2: Python AI service ────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

COPY emr-ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY emr-ai/ .

# Copy the built frontend JS into the static directory served by FastAPI
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
