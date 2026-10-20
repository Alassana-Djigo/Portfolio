from django import forms

from .models import ContactMessage

MESSAGE_MIN = 10
MESSAGE_MAX = 3000


class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]
        error_messages = {
            "name": {
                "required": "Please enter your name.",
                "max_length": "That name is too long.",
            },
            "email": {
                "required": "Please enter your email.",
                "invalid": "Please enter a valid email address.",
            },
            "subject": {"max_length": "The subject is too long (150 characters max)."},
            "message": {"required": "Please write a message."},
        }

    def clean_name(self):
        return self.cleaned_data["name"].strip()

    def clean_message(self):
        message = self.cleaned_data["message"].strip()
        if len(message) < MESSAGE_MIN:
            raise forms.ValidationError(f"Please write at least {MESSAGE_MIN} characters.")
        if len(message) > MESSAGE_MAX:
            raise forms.ValidationError(f"Please keep the message under {MESSAGE_MAX} characters.")
        return message
