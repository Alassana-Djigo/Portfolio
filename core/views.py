from datetime import timedelta

from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from .forms import ContactForm
from .models import Certification, ContactMessage, Experience, Lab, Project, Skill, SkillCategory

# Ordem em que as secções aparecem na página (e na numeração 01, 02, ...)
SECTION_ORDER = ["about", "skills", "security", "projects", "experience", "contact"]

# Travão anti-spam: máximo de mensagens guardadas por hora (todas as pessoas juntas)
MAX_MESSAGES_PER_HOUR = 30


def home(request):
    skill_categories = SkillCategory.objects.prefetch_related("skills")
    projects = Project.objects.all()
    experiences = Experience.objects.all()
    labs = Lab.objects.all()
    certifications = Certification.objects.all()

    # Uma secção sem dados não aparece (nem no menu): o site público nunca mostra caixas vazias.
    show = {
        "about": True,
        "skills": bool(skill_categories),
        "security": bool(labs) or bool(certifications),
        "projects": bool(projects),
        "experience": bool(experiences),
        "contact": True,
    }
    # Numeração só das secções visíveis, sem buracos (01, 02, 03...).
    num, n = {}, 0
    for key in SECTION_ORDER:
        if show[key]:
            n += 1
            num[key] = f"{n:02d}"

    context = {
        "skill_categories": skill_categories,
        "skills_total": Skill.objects.count(),
        "projects": projects,
        "experiences": experiences,
        "labs": labs,
        "certifications": certifications,
        "show": show,
        "num": num,
    }
    return render(request, "home.html", context)


@require_POST
def contact(request):
    """Recebe o formulário de contacto. Com JS responde em JSON; sem JS, redireciona."""
    ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

    def respond(ok, text, status=200, errors=None):
        if ajax:
            payload = {"ok": ok, "message": text}
            if errors:
                payload["errors"] = errors
            return JsonResponse(payload, status=status)
        (messages.success if ok else messages.error)(request, text)
        return redirect(f"{reverse('home')}#contact")

    success = "Message sent. Thank you, I'll get back to you soon."

    # Honeypot: campo invisível que pessoas não preenchem. Se vier preenchido é um bot:
    # finge sucesso e não guarda nada.
    if request.POST.get("website"):
        return respond(True, success)

    form = ContactForm(request.POST)
    if not form.is_valid():
        errors = {field: [str(e) for e in errs] for field, errs in form.errors.items()}
        first_error = next(iter(errors.values()))[0]
        return respond(False, first_error, status=400, errors=errors)

    since = timezone.now() - timedelta(hours=1)
    if ContactMessage.objects.filter(created_at__gte=since).count() >= MAX_MESSAGES_PER_HOUR:
        return respond(
            False,
            "Too many messages right now. Please try again later or email me directly.",
            status=429,
        )

    form.save()
    return respond(True, success)
