# --- Stage 1: Build the frontend SPA ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --no-frozen-lockfile
COPY . .
# Inject Vite env vars during build-time compilation
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN pnpm build

# --- Stage 2: Build the final unified Python container ---
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code and built frontend static assets
COPY backend/ /app/backend/
COPY --from=frontend-builder /app/dist /app/dist

# Expose standard port
EXPOSE 8000

# Execute migrations, collectstatic, and start Gunicorn from the backend directory
CMD cd backend && \
    python manage.py collectstatic --noinput && \
    python manage.py migrate && \
    gunicorn icemgs_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
