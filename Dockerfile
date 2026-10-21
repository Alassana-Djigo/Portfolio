FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Utilizador sem privilégios; /data guarda a base de dados (volume) e /app/staticfiles os estáticos
RUN useradd --system --uid 10001 app \
    && mkdir -p /data /app/staticfiles \
    && chown -R app /data /app/staticfiles
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python deploy/healthcheck.py

CMD ["sh", "deploy/entrypoint.sh"]
