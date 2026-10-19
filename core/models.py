from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def split_tags(text):
    """Converte 'Django, PostgreSQL, Docker' numa lista limpa."""
    return [t.strip() for t in text.split(",") if t.strip()]


class SkillCategory(models.Model):
    name = models.CharField("nome", max_length=60)
    order = models.PositiveSmallIntegerField("ordem", default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "categoria de skill"
        verbose_name_plural = "categorias de skills"

    def __str__(self):
        return self.name


class Skill(models.Model):
    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.CASCADE,
        related_name="skills",
        verbose_name="categoria",
    )
    name = models.CharField("nome", max_length=60)
    level = models.PositiveSmallIntegerField(
        "nível (0-100)",
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    order = models.PositiveSmallIntegerField("ordem", default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Project(models.Model):
    title = models.CharField("título", max_length=100)
    description = models.TextField("descrição")
    tags = models.CharField(
        "tecnologias", max_length=200, help_text="Separadas por vírgula: Django, PostgreSQL"
    )
    github_url = models.URLField("link do GitHub", blank=True)
    live_url = models.URLField("link ao vivo", blank=True)
    featured = models.BooleanField("em destaque", default=False)
    order = models.PositiveSmallIntegerField("ordem", default=0)

    class Meta:
        ordering = ["order", "title"]
        verbose_name = "projecto"
        verbose_name_plural = "projectos"

    def __str__(self):
        return self.title

    @property
    def tag_list(self):
        return split_tags(self.tags)


class Experience(models.Model):
    role = models.CharField("cargo", max_length=100)
    organization = models.CharField("organização", max_length=100)
    kind = models.CharField(
        "tipo", max_length=40, blank=True, help_text="Ex.: Full-time, Fundador, Curso"
    )
    start_year = models.PositiveSmallIntegerField("ano de início")
    end_year = models.PositiveSmallIntegerField(
        "ano de fim", null=True, blank=True, help_text="Deixa vazio se ainda está a decorrer"
    )
    description = models.TextField("descrição")
    tags = models.CharField("tecnologias", max_length=200, blank=True)

    class Meta:
        ordering = ["-start_year", "-end_year"]
        verbose_name = "experiência"
        verbose_name_plural = "experiências"

    def __str__(self):
        return f"{self.role} @ {self.organization}"

    @property
    def is_current(self):
        return self.end_year is None

    @property
    def tag_list(self):
        return split_tags(self.tags)


class Lab(models.Model):
    """Salas e labs de segurança (TryHackMe, Hack The Box, labs próprios...)."""

    title = models.CharField("título", max_length=100)
    platform = models.CharField("plataforma", max_length=60)
    description = models.TextField("o que aprendeste", blank=True)
    url = models.URLField("link", blank=True)
    completed_on = models.DateField("concluído em", null=True, blank=True)
    tags = models.CharField("tópicos", max_length=200, blank=True)

    class Meta:
        ordering = ["-completed_on", "title"]

    def __str__(self):
        return f"{self.title} ({self.platform})"

    @property
    def tag_list(self):
        return split_tags(self.tags)


class Certification(models.Model):
    title = models.CharField("título", max_length=120)
    issuer = models.CharField("entidade", max_length=100)
    year = models.PositiveSmallIntegerField("ano", null=True, blank=True)
    in_progress = models.BooleanField("em curso", default=False)
    url = models.URLField("link de verificação", blank=True)

    class Meta:
        ordering = ["-year", "title"]
        verbose_name = "certificação"
        verbose_name_plural = "certificações"

    def __str__(self):
        return self.title
