# PolicyLens MVP

## Description
An AI-powered web application that allows users to upload complex insurance policies and instantly get simplified summaries, risk assessments, and highlighted clauses. 

## Features
- **Document Upload**: Supports PDF and TXT file uploads.
- **NLP Preprocessing**: Extracts text and breaks it down into individual clauses.
- **AI Analysis**: Uses Google Gemini API to simplify policy language, extract conditions and exclusions, and highlight risky clauses.
- **Risk Assessment**: Calculates an overall risk score from 1-10 based on unfavorable clauses.
- **Modern UI**: A responsive, SaaS-style frontend built with Next.js and Tailwind CSS.

## How to run

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment
venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Environment Variables
Create a `.env` file in the backend directory (or use `.env.example` as a template):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start the Application
**Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
API runs at `http://127.0.0.1:8000`.

**Frontend:**
```bash
cd frontend
npm run dev
```
App runs at `http://localhost:3000`.
