from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from .models import ContactMessage, Project
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
