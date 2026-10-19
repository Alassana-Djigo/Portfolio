from django.contrib import admin

from .models import Certification, Experience, Lab, Project, Skill, SkillCategory


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1


@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "order")
    list_editable = ("order",)
    inlines = [SkillInline]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "featured", "order")
    list_editable = ("featured", "order")


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("role", "organization", "start_year", "end_year")


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ("title", "platform", "completed_on")
    list_filter = ("platform",)


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ("title", "issuer", "year", "in_progress")
