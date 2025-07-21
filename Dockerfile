FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5002

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=backend/app.py

# Change to backend directory and run the app
WORKDIR /app/backend
CMD ["python", "app.py"]
