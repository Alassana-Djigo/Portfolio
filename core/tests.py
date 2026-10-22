from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .models import ContactMessage, Experience, Project
from .views import MAX_MESSAGES_PER_HOUR

AJAX = {"HTTP_X_REQUESTED_WITH": "XMLHttpRequest"}
VALID = {
    "name": "Ana",
    "email": "ana@example.com",
    "subject": "Opportunity",
    "message": "Hello, I would like to talk about a role.",
}


class HomePageTests(TestCase):
    def test_home_loads_with_empty_database(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'id="contact"')
        self.assertNotContains(response, 'id="projects"')  # secção vazia fica escondida

    def test_section_appears_when_it_has_data(self):
        Project.objects.create(title="P", description="d", tags="Django")
        response = self.client.get(reverse("home"))
        self.assertContains(response, 'id="projects"')
        self.assertContains(response, 'href="#projects"')

    def test_page_contains_csrf_token_for_the_form(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, "csrfmiddlewaretoken")


class ContactFormTests(TestCase):
    def setUp(self):
        self.url = reverse("contact")

    def test_valid_post_with_js_saves_and_returns_json(self):
        response = self.client.post(self.url, VALID, **AJAX)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(ContactMessage.objects.count(), 1)
        self.assertEqual(ContactMessage.objects.get().email, "ana@example.com")

    def test_valid_post_without_js_redirects_back_to_contact(self):
        response = self.client.post(self.url, VALID, follow=True)
        self.assertRedirects(response, reverse("home") + "#contact", fetch_redirect_response=False)
        self.assertContains(response, "Message sent")
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_invalid_email_is_rejected(self):
        response = self.client.post(self.url, {**VALID, "email": "not-an-email"}, **AJAX)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["ok"])
        self.assertIn("valid email", response.json()["message"])
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_short_message_is_rejected(self):
        response = self.client.post(self.url, {**VALID, "message": "hi"}, **AJAX)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_missing_name_is_rejected(self):
        response = self.client.post(self.url, {**VALID, "name": ""}, **AJAX)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_honeypot_pretends_success_but_saves_nothing(self):
        response = self.client.post(self.url, {**VALID, "website": "http://spam.example"}, **AJAX)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_hourly_limit_blocks_flood(self):
        ContactMessage.objects.bulk_create(
            [ContactMessage(name="x", email="x@example.com", message="m" * 10)
             for _ in range(MAX_MESSAGES_PER_HOUR)]
        )
        response = self.client.post(self.url, VALID, **AJAX)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(ContactMessage.objects.count(), MAX_MESSAGES_PER_HOUR)

    def test_get_is_not_allowed(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)

    def test_csrf_is_enforced(self):
        strict = Client(enforce_csrf_checks=True)
        self.assertEqual(strict.post(self.url, VALID, **AJAX).status_code, 403)
        self.assertEqual(ContactMessage.objects.count(), 0)


class ContactAdminTests(TestCase):
    def setUp(self):
        user = get_user_model().objects.create_superuser("admin", "a@example.com", "pw-12345-xyz")
        self.client.force_login(user)

    def test_messages_are_listed_in_admin(self):
        ContactMessage.objects.create(name="Ana", email="ana@example.com", message="Hello there!!")
        response = self.client.get("/admin/core/contactmessage/")
        self.assertContains(response, "ana@example.com")

    def test_admin_cannot_add_messages_by_hand(self):
        self.assertEqual(self.client.get("/admin/core/contactmessage/add/").status_code, 403)


class AboutSceneTests(TestCase):
    def test_about_has_tech_scene_with_fallback_list(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, 'id="techScene"')
        self.assertContains(response, 'id="techCanvas"')
        self.assertContains(response, "tech-icons.js")
        self.assertContains(response, "techcubes.js")
        self.assertEqual(response.content.decode().count("<li data-key="), 7)


LOCMEM = "django.core.mail.backends.locmem.EmailBackend"


class ContactEmailTests(TestCase):
    def setUp(self):
        self.url = reverse("contact")

    @override_settings(CONTACT_NOTIFY_EMAIL="me@example.com", EMAIL_BACKEND=LOCMEM)
    def test_email_is_sent_when_configured(self):
        response = self.client.post(self.url, VALID, **AJAX)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["me@example.com"])
        self.assertIn("Ana", mail.outbox[0].subject)
        self.assertIn(VALID["message"], mail.outbox[0].body)

    @override_settings(CONTACT_NOTIFY_EMAIL="", EMAIL_BACKEND=LOCMEM)
    def test_no_email_when_not_configured(self):
        self.client.post(self.url, VALID, **AJAX)
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(ContactMessage.objects.count(), 1)

    @override_settings(CONTACT_NOTIFY_EMAIL="me@example.com", EMAIL_BACKEND=LOCMEM)
    def test_email_failure_never_breaks_the_form(self):
        with patch("core.views.send_mail", side_effect=OSError("smtp down")):
            with self.assertLogs("core.views", level="ERROR"):
                response = self.client.post(self.url, VALID, **AJAX)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(ContactMessage.objects.count(), 1)  # a mensagem ficou guardada

    @override_settings(CONTACT_NOTIFY_EMAIL="me@example.com", EMAIL_BACKEND=LOCMEM)
    def test_no_email_for_honeypot_or_invalid(self):
        self.client.post(self.url, {**VALID, "website": "spam"}, **AJAX)
        self.client.post(self.url, {**VALID, "email": "nope"}, **AJAX)
        self.assertEqual(len(mail.outbox), 0)


class HealthCheckTests(TestCase):
    def test_healthz_is_ok(self):
        response = self.client.get(reverse("healthz"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")


class ExperienceDisplayTests(TestCase):
    def test_single_year_and_ongoing_dates(self):
        Experience.objects.create(role="Diploma", organization="School", start_year=2022, end_year=2022, description="d")
        Experience.objects.create(role="Course", organization="Campus", start_year=2025, description="d")
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn(">2022<", html)            # um só ano
        self.assertNotIn("2022 — 2022", html)
        self.assertIn("2025 — Present", html)    # ainda a decorrer
