# Gmail Invoice Scanner - Running Guide

This guide explains how to start the application (Backend & Frontend).

## Prerequisites
- **Python 3.8+**
- **Node.js** (v16+ recommended)

## 1. Start the Backend
The backend is a FastAPI application.

1.  Open a terminal in the project root: `gmail_invoice_scanner/`
2.  Activate the virtual environment:
    ```powershell
    .\backend\venv\Scripts\Activate.ps1
    # OR if using Command Prompt:
    backend\venv\Scripts\activate.bat
    ```
3.  Run the server:
    ```bash
    python -m uvicorn backend.main:app --reload
    ```
    *The server will start at `http://127.0.0.1:8000`*

## 2. Start the Frontend
The frontend is a React + Vite application.

1.  Open a **new** terminal.
2.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    *The app will be accessible at `http://localhost:5173`*

## Troubleshooting
- **Port already in use**: If you see an error about port 8000 or 5173 being in use, make sure you don't have another instance running. You can kill the process or restart your terminal.
- **Dependencies missing**:
    - Backend: Run `pip install -r backend/requirements.txt`
    - Frontend: Run `npm install` in the `frontend` directory.
