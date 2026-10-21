"""Verificação de saúde do contentor: pede /healthz ao próprio gunicorn."""
import os
import sys
import urllib.request

host = (os.getenv("ALLOWED_HOSTS", "localhost").split(",")[0].strip()) or "localhost"
request = urllib.request.Request(
    "http://127.0.0.1:8000/healthz",
    headers={"Host": host, "X-Forwarded-Proto": "https"},  # finge ser o proxy, senão o redirect HTTPS responde 301
)
try:
    sys.exit(0 if urllib.request.urlopen(request, timeout=4).status == 200 else 1)
except Exception:
    sys.exit(1)
