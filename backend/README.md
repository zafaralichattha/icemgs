# ICEMGS Backend - Django REST API

**Intelligent Construction Estimation and Map Generator System**

Complete Django backend with PostgreSQL for construction cost estimation, project management, and 2D floor plan generation.

---

## 🏗️ Features

- **User Management** - Role-based authentication (Homeowner, Contractor, Student, Admin)
- **Google OAuth Integration** - Social authentication support
- **Material Catalog** - Comprehensive material pricing with quality tiers
- **Project Management** - Full CRUD operations for construction projects
- **Cost Estimation** - Automated gray structure and finishing cost calculations
- **Bill of Materials** - Auto-generated BOM for each project
- **Admin Dashboard** - Complete admin interface for managing users and materials
- **Cost History** - Track material price changes over time
- **2D Floor Plan Generation** - LDA bylaw-compliant floor plan generation
- **Analytics Dashboard** - User and admin statistics

---

## 📋 Prerequisites

- Python 3.9 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)
- Virtual environment (recommended)

---

## 🚀 Installation & Setup

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE icemgs_db;

# Create user (optional)
CREATE USER icemgs_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE icemgs_db TO icemgs_user;

# Exit
\q
```

### 5. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Important Environment Variables:**

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=icemgs_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 6. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Initialize Default Materials

```bash
python manage.py init_materials
```

This will populate the database with default material prices for all categories.

### 8. Create Superuser

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 9. Run Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

Admin panel: `http://localhost:8000/admin/`

---

## 📚 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | User login |
| `/api/auth/logout/` | POST | User logout |
| `/api/auth/registration/` | POST | User registration |
| `/api/auth/google/` | POST | Google OAuth login |
| `/api/auth/user/` | GET | Get current user |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/` | GET | List all users (admin) |
| `/api/users/me/` | GET | Get current user profile |
| `/api/users/update_profile/` | PUT/PATCH | Update profile |

### Materials

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/materials/` | GET | List all materials |
| `/api/materials/` | POST | Create material (admin) |
| `/api/materials/{id}/` | GET | Get material details |
| `/api/materials/{id}/` | PUT/PATCH | Update material (admin) |
| `/api/materials/{id}/` | DELETE | Delete material (admin) |
| `/api/materials/by_category/?category=floor_tiles` | GET | Filter by category |
| `/api/materials/bulk_update_rates/` | POST | Bulk update rates (admin) |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/` | GET | List user's projects |
| `/api/projects/` | POST | Create new project |
| `/api/projects/{id}/` | GET | Get project details |
| `/api/projects/{id}/` | PUT/PATCH | Update project |
| `/api/projects/{id}/` | DELETE | Delete project |
| `/api/projects/{id}/calculate_costs/` | POST | Calculate project costs |
| `/api/projects/{id}/generate_floor_plan/` | POST | Generate 2D floor plan |

### Floors & Rooms

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/floors/` | GET/POST | List/Create floors |
| `/api/floors/{id}/` | GET/PUT/PATCH/DELETE | Floor operations |
| `/api/rooms/` | GET/POST | List/Create rooms |
| `/api/rooms/{id}/` | GET/PUT/PATCH/DELETE | Room operations |

### Finishing & BOM

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/finishing/` | GET/POST | Finishing details |
| `/api/bill-of-materials/` | GET | View BOMs |
| `/api/cost-history/` | GET | Material cost history |

### Dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats/` | GET | Dashboard statistics |

---

## 🔐 Authentication

The API uses **Token Authentication**. After login, include the token in request headers:

```bash
Authorization: Token your-auth-token-here
```

**Example Login Request:**

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Response:**

```json
{
  "key": "your-auth-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "homeowner"
  }
}
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Homeowner** | Create/manage own projects, view materials |
| **Contractor** | Create/manage own projects, view materials |
| **Student** | Create/manage own projects, view materials |
| **Admin** | Full access, manage all users, materials, and projects |

---

## 💰 Material Categories

- Floor Tiles (Standard, Good, Premium)
- Wall Tiles (Standard, Good, Premium)
- Paint (Standard, Good, Premium)
- Doors (Standard, Good, Premium)
- Windows (Standard, Good, Premium)
- Electrical Packages
- Plumbing Packages
- Sanitary Packages
- Kitchen Cabinets
- Gray Structure Materials (Cement, Steel, Bricks, Sand, Gravel)

---

## 🔧 Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/`

**Features:**

- User management with role assignment
- Material price updates with automatic history tracking
- Project monitoring and management
- View all BOMs and cost calculations
- Material price history and trends

---

## 🌐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback/`
   - Your production URL
6. Copy Client ID and Secret to `.env` file

---

## 🚢 Deployment

### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

### Option 2: Render

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn icemgs_backend.wsgi:application`
5. Add PostgreSQL database
6. Set environment variables

### Option 3: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SECRET_KEY="your-secret-key"
heroku config:set DEBUG=False

# Deploy
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Initialize materials
heroku run python manage.py init_materials

# Create superuser
heroku run python manage.py createsuperuser
```

### Production Checklist

- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Configure allowed hosts
- [ ] Set up SSL/HTTPS
- [ ] Configure production database
- [ ] Set up static file serving (WhiteNoise configured)
- [ ] Configure email backend
- [ ] Set up monitoring and logging
- [ ] Enable database backups

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test estimation

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 📊 Database Schema

**Main Models:**

- **User** - Custom user model with email authentication
- **Material** - Material catalog with pricing
- **Project** - Construction project details
- **Floor** - Individual floors within a project
- **Room** - Room details for each floor
- **FinishingDetails** - Material selections for finishing
- **BillOfMaterial** - Auto-generated BOM
- **CostHistory** - Material price change history

---

## 🔄 Frontend Integration

Update your React frontend API base URL:

```typescript
// src/config/api.ts
export const API_BASE_URL = 'http://localhost:8000/api/';

// Add authentication token to requests
axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify database exists
psql -U postgres -l
```

### Migration Issues

```bash
# Reset migrations (development only)
python manage.py migrate estimation zero
python manage.py migrate

# Or delete database and recreate
dropdb icemgs_db
createdb icemgs_db
python manage.py migrate
```

### CORS Errors

Make sure frontend URL is in `CORS_ALLOWED_ORIGINS` in `.env` file.

---

## 📞 Support

For issues or questions, please create an issue in the repository.

---

## 📝 License

This project is licensed under the MIT License.

---

## 🎯 Next Steps

1. ✅ Backend setup complete
2. Connect React frontend to API endpoints
3. Test authentication flow
4. Implement real-time cost calculations
5. Add 2D floor plan generation logic
6. Deploy to production

---

**Built with Django, PostgreSQL, and Django REST Framework**
