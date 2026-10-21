#!/bin/sh
# Arranque do contentor: aplica migrações, recolhe estáticos e lança o gunicorn.
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec gunicorn port.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${WEB_CONCURRENCY:-2}" \
    --access-logfile - \
    --error-logfile - \
    --no-control-socket
