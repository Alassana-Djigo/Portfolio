from django.contrib import admin

from .models import Certification, ContactMessage, Experience, Lab, Project, Skill, SkillCategory


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


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_filter = ("is_read",)
    list_editable = ("is_read",)
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "created_at")

    def has_add_permission(self, request):
        return False  # as mensagens só chegam pelo formulário do site
