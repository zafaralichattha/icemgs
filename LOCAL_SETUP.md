# Local Development Setup Guide

This guide provides step-by-step instructions for setting up the virtual development environment and running **ICEMGS** locally on Windows.

---

## Prerequisites
Before starting, ensure you have the following installed on your machine:
1. **Python** (version 3.10 or higher) -> [Download Python](https://www.python.org/downloads/)
2. **Node.js** (LTS version) -> [Download Node.js](https://nodejs.org/)
3. **PostgreSQL Database** -> [Download PostgreSQL](https://www.postgresql.org/download/)
4. **Git** (optional, for version control)

---

## Step 1: Project Installation & Package setup

1. Open a terminal (PowerShell or Command Prompt) and navigate to the project root directory:
   ```powershell
   cd c:\Users\computer\Downloads\icemgswithBackend0.2
   ```

2. Install the frontend dependencies using **pnpm** (or **npm**):
   ```powershell
   pnpm install
   ```
   *(If `pnpm` is not installed, install it globally using `npm install -g pnpm`, or fallback to `npm install`)*

---

## Step 2: Backend Virtual Environment Setup

1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```

2. Create a virtual environment named `venv`:
   ```powershell
   python -m venv venv
   ```

3. Activate the virtual environment:
   * **PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Command Prompt**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```

4. Upgrade `pip` and install all required Python packages:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## Step 3: Database & Environment Configuration

1. Create a database named `icemgs_db` in your PostgreSQL server (using pgAdmin or `psql` shell):
   ```sql
   CREATE DATABASE icemgs_db;
   ```

2. Configure environment variables. In the `backend` directory, check if a `.env` file exists. If not, copy it from `.env.example`:
   ```powershell
   copy .env.example .env
   ```

3. Open the `backend\.env` file and set your PostgreSQL credentials:
   ```env
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   DB_NAME=icemgs_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432

   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

---

## Step 4: Run Migrations & Seed Default Materials

Ensure your virtual environment is activated, then run the database setup commands from the `backend` folder:

1. Create and apply database schemas:
   ```powershell
   python manage.py migrate
   ```

2. Seed default materials and unit rates:
   ```powershell
   python manage.py init_materials
   ```

3. Create an administrator (superuser) account:
   ```powershell
   python manage.py createsuperuser
   ```
   *(Follow the prompts to enter an email and password)*

---

## Step 5: Run the Project

You can run both the frontend and backend servers concurrently or in separate terminals.

### Method A: Single Command (Concurrently)
From the **project root directory** (where `package.json` is located), run:
```powershell
npm start
```
This automatically spins up:
* **Frontend Dev Server**: `http://localhost:5173/` (or `http://localhost:5174/` if 5173 is occupied)
* **Django Backend Server**: `http://localhost:8000/`

---

### Method B: Separate Terminals (Manual)

#### Terminal 1: Frontend
From the root directory:
```powershell
npm run dev
```

#### Terminal 2: Backend
From the `backend` directory (with `venv` activated):
```powershell
python manage.py runserver
```
