# Use official lightweight Python image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable live log streaming
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Install system packages needed for compiling psycopg2 and general net operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application codebase
COPY . .

# Expose server port
EXPOSE 8080

# Start server on 0.0.0.0 to receive queries over Cloud Run ingress
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
