@echo off
REM ICEMGS Backend Setup Script for Windows
REM This script automates the setup process for local development

echo.
echo 🏗️  ICEMGS Backend Setup
echo ================================
echo.

REM Check Python version
echo 📌 Checking Python version...
python --version

REM Create virtual environment
echo 📦 Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ⚠️  Virtual environment already exists
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo ✅ Dependencies installed

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your database credentials
) else (
    echo ✅ .env file exists
)

REM Run migrations
echo 🔄 Running migrations...
python manage.py makemigrations
python manage.py migrate
echo ✅ Migrations complete

REM Initialize materials
echo 💰 Initializing default materials...
python manage.py init_materials
echo ✅ Materials initialized

REM Create superuser
echo.
echo 👤 Creating superuser account...
set /p create_super="Create superuser now? (y/n): "
if /i "%create_super%"=="y" (
    python manage.py createsuperuser
)

echo.
echo ================================
echo ✅ Setup complete!
echo.
echo 🚀 To start the development server:
echo    python manage.py runserver
echo.
echo 🔐 Admin panel: http://localhost:8000/admin/
echo 📡 API endpoints: http://localhost:8000/api/
echo.
echo 📚 Read README.md for full documentation
echo ================================
echo.
pause
