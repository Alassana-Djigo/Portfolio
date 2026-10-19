from django.shortcuts import render

from .models import Certification, Experience, Lab, Project, SkillCategory


def home(request):
    context = {
        "skill_categories": SkillCategory.objects.prefetch_related("skills"),
        "projects": Project.objects.all(),
        "experiences": Experience.objects.all(),
        "labs": Lab.objects.all(),
        "certifications": Certification.objects.all(),
    }
    return render(request, "home.html", context)
