@echo off
echo ====================================
echo  Test Automation Platform Setup
echo ====================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo.
echo Setting up Python virtual environment...
if not exist .venv (
    python -m venv .venv
)

echo.
echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Installing Python dependencies...
pip install -r backend\requirements.txt

echo.
echo Installing Node.js dependencies...
cd frontend
npm install --legacy-peer-deps
cd ..

echo.
echo ====================================
echo  Setup Complete!
echo ====================================
echo.
echo IMPORTANT: Before running the application:
echo 1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
echo 2. Edit backend\.env file and add your API key
echo.
echo To start the application:
echo 1. Run: npm run start-backend (in one terminal)
echo 2. Run: npm run start-frontend (in another terminal)
echo.
echo Or use VS Code tasks:
echo - Ctrl+Shift+P -> "Tasks: Run Task" -> "Start Both Servers"
echo.
pause
