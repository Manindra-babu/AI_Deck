@echo off
echo ========================================================
echo Starting AI Intelligence Radar (Backend & Frontend)
echo ========================================================

echo Starting Backend on http://localhost:8000...
start cmd /k "cd backend && .\venv\Scripts\python run.py"

echo Starting Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both services are launching:
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo ========================================================
pause
