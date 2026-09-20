# dependency builder
FROM python:3.11-slim AS builder

WORKDIR /build

# System-level build deps (for packages that compile C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: production runner
FROM python:3.11-slim AS runner

# Non-root user for least-privilege execution
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY ./app ./app

# SQLite data directory — persisted via Docker volume
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

# Expose the Uvicorn port
EXPOSE 8000

# Health check — used by Docker Compose and orchestrators
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Production command (override in dev with --reload via compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
