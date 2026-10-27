# EduGenie

EduGenie is a lightweight AI-powered educational assistant built with FastAPI and Google Gemini.
It can explain any topic, generate quizzes, build study plans and create flashcards.

## Run in VS Code

1. Open this folder in VS Code and open a terminal (Ctrl+`).
2. Create and activate a virtual environment:
   - Windows: `python -m venv .venv` then `.venv\Scripts\activate`
   - macOS/Linux: `python3 -m venv .venv` then `source .venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and put your key in it (get one free at https://aistudio.google.com/apikey).
5. Start the app: `uvicorn app:app --reload`
6. Open http://127.0.0.1:8000

## Files

- `app.py` – FastAPI server and `/api/generate` endpoint
- `gemini_service.py` – Gemini calls and prompts
- `index.html`, `script.js`, `style.css` – the web interface
- `requirements.txt` – Python dependencies

Never commit your `.env` file; it is already listed in `.gitignore`.
