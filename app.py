from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

import gemini_service

app = FastAPI(title="EduGenie")


class Req(BaseModel):
    mode: str
    topic: str
    level: str = "Intermediate"
    extra: str = ""


@app.post("/api/generate")
def generate(req: Req):
    if not req.topic.strip():
        raise HTTPException(400, "Topic is required")
    try:
        return gemini_service.generate(req.mode, req.topic.strip(), req.level, req.extra)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/")
def home():
    return FileResponse("index.html")


@app.get("/script.js")
def js():
    return FileResponse("script.js")


@app.get("/style.css")
def css():
    return FileResponse("style.css")
