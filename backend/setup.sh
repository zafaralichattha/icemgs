#!/bin/bash

# ICEMGS Backend Setup Script
# This script automates the setup process for local development

set -e  # Exit on error

echo "🏗️  ICEMGS Backend Setup"
echo "================================"

# Check Python version
echo "📌 Checking Python version..."
python3 --version

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "⚠️  Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "✅ .env file exists"
fi

# Check PostgreSQL connection
echo "🔍 Checking database connection..."
read -p "Database name (default: icemgs_db): " db_name
db_name=${db_name:-icemgs_db}

read -p "Database user (default: postgres): " db_user
db_user=${db_user:-postgres}

# Run migrations
echo "🔄 Running migrations..."
python manage.py makemigrations
python manage.py migrate
echo "✅ Migrations complete"

# Initialize materials
echo "💰 Initializing default materials..."
python manage.py init_materials
echo "✅ Materials initialized"

# Create superuser
echo "👤 Creating superuser account..."
read -p "Create superuser now? (y/n): " create_super
if [ "$create_super" = "y" ]; then
    python manage.py createsuperuser
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   python manage.py runserver"
echo ""
echo "🔐 Admin panel: http://localhost:8000/admin/"
echo "📡 API endpoints: http://localhost:8000/api/"
echo ""
echo "📚 Read README.md for full documentation"
echo "================================"
