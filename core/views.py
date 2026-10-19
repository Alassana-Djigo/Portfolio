from django.shortcuts import render

from .models import Certification, Experience, Lab, Project, Skill, SkillCategory

# Ordem em que as secções aparecem na página (e na numeração 01, 02, ...)
SECTION_ORDER = ["about", "skills", "security", "projects", "experience", "contact"]


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
