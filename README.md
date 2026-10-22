# Portfolio — Alassana Djigo

Personal portfolio built with Django. Live site: https://adjigo.pythonanywhere.com/

It presents my projects, skills and learning path, with an interactive 3D hero (a Lorenz attractor rendered in real time) and floating 3D technology cubes. All the content is managed from the Django admin, so nothing needs to be edited in the code to update it.

## Features

- **Data-driven sections**: skills, networks & security labs and certifications, projects and experience are managed from the admin. A section with no data is hidden automatically, together with its menu link.
- **Working contact form**: messages are saved in the admin, with CSRF protection, a honeypot field, an hourly rate cap and an optional email notification.
- **3D visuals**: a Three.js hero (Lorenz attractor) and interactive technology cubes (hover or tap for details), with fallbacks for reduced-motion and for browsers without WebGL.
- **Production-ready settings**: WhiteNoise for static files, secure cookies, HSTS, a configurable admin URL and a health-check endpoint (`/healthz`).
- **Automated tests** with the Django test runner.
- **Optional deployment files** for Docker and Caddy (see `deploy/`).

## Tech stack

Python 3.12+, Django 6.1, SQLite, Gunicorn, WhiteNoise. The front end uses plain HTML, CSS and JavaScript, with Three.js and GSAP vendored in `static/vendor/`.

## Getting started

### Prerequisites

- Git
- Python 3.12 or newer (check with `python3 --version`)

### 1. Clone the repository

```bash
git clone https://github.com/Alassana-Djigo/Portfolio.git
cd Portfolio
```

### 2. Create a virtual environment

This keeps the project dependencies isolated from the rest of your system.

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows (PowerShell), activate it with:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Install the dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure the environment

Django needs a secret key to start. The repository includes an example file:

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Open `.env` in your editor and replace the placeholder with the generated key:
SECRET_KEY=PASTE_THE_GENERATED_KEY_HERE
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost


> Never commit the `.env` file or share your secret key. Git is already configured to ignore `.env`.

### 5. Prepare the database

```bash
python manage.py check
python manage.py migrate
```

### 6. Create an admin user

```bash
python manage.py createsuperuser
```

### 7. Run the development server

```bash
python manage.py runserver
```

Open http://127.0.0.1:8000/ for the site and http://127.0.0.1:8000/admin/ for the admin panel.

### 8. Run the tests (optional)

```bash
python manage.py test
```

## Adding content

Log in to the admin and add entries in these sections (the admin interface is in Portuguese):

| Admin section | Shown on the site as |
|---|---|
| Categorias de skills (with skills inside) | Skills |
| Projectos | Projects |
| Experiências | Experience / journey |
| Labs | Networks & Security (labs & rooms) |
| Certificações | Networks & Security (certifications) |
| Mensagens de contacto | Messages sent through the contact form (read-only) |

## Configuration

All settings are read from environment variables (or the `.env` file).

| Variable | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | none (required) | Django secret key |
| `DEBUG` | `False` | Debug mode. Use `True` only in development |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated hostnames |
| `CSRF_TRUSTED_ORIGINS` | empty | HTTPS origins allowed to post forms, e.g. `https://example.com` |
| `ADMIN_URL` | `admin` | Admin path. Change it in production |
| `SQLITE_PATH` | `db.sqlite3` in the project | Location of the SQLite database |
| `SECURE_SSL_REDIRECT` | `True` when `DEBUG=False` | Set to `False` if HTTPS is handled by the host |
| `SECURE_HSTS_SECONDS` | `3600` when `DEBUG=False` | HSTS duration |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | empty | SMTP settings. Without `EMAIL_HOST`, emails are printed to the console |
| `CONTACT_NOTIFY_EMAIL` | empty | Address that receives a notification for each contact message |

## Deployment

- **Any WSGI host**: set the environment variables, then run `python manage.py migrate`, `python manage.py collectstatic --noinput` and serve `port.wsgi:application` with Gunicorn.
- **PythonAnywhere (free tier)**: map `/static/` to the `staticfiles/` directory and set `SECURE_SSL_REDIRECT=False`, since HTTPS is handled by the platform. Outbound email is not available on the free tier, so messages are only stored in the admin.
- **Docker + Caddy on a VPS**: see `docker-compose.yml`, `.env.production.example` and the `deploy/` folder.

## Project structure
- core/ models, admin, views, forms, tests and migrations
- port/ project settings and URLs
- templates/ base template, partials and one template per page section
- static/ CSS and JavaScript (hero3d.js, techcubes.js) and vendored libraries
- deploy/ Docker entrypoint, health check, backup script and Caddy proxy


## Credits

Technology logos come from [Simple Icons](https://simpleicons.org/) (CC0); the trademarks belong to their respective owners. Three.js and GSAP are included under their own licenses.
EOF