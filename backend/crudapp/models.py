# models.py
from django.db import models
from django.utils import timezone
from .middleware import ClientIPMiddleware
import os


def upload_to(instance, filename):
    # Handle the filename separately
    current_datetime = timezone.now().strftime("%Y%m%d%H%M%S")
    _, extension = os.path.splitext(filename)
    new_filename = f"{current_datetime}{extension}"
    return f'public/personalinfo/{new_filename}'
class PersonalInfo(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=250, unique=True)
    mobile = models.CharField(max_length=250, unique=True)
    image = models.ImageField(upload_to=upload_to, null=True, blank=True)
    user_ip = models.GenericIPAddressField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "1. Personal Info"
        verbose_name_plural = "1. Personal Info"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            # It's a new instance being created
            self.is_created = True  # Mark the instance as created
            request = self._get_dummy_request()
            middleware = ClientIPMiddleware(get_response=None)
            middleware.get_response = lambda request: None
            middleware(request)
            self.user_ip = kwargs.pop(
                'user_ip', middleware.get_client_ip(request))
            
        # Set a default image if not provided
        if not self.image:
            # Change this to your default image path
            self.image = 'public/personalinfo/default_image.jpg'

        # Check if it's an update and the image has changed
        if self.pk is not None:
            old_instance = PersonalInfo.objects.get(pk=self.pk)
            if old_instance.image != self.image:
                # Delete the old image file
                old_instance.image.delete(save=False)

        super().save(*args, **kwargs)

    def _get_dummy_request(self):
        from django.test import RequestFactory
        request_factory = RequestFactory()
        return request_factory.get('/')
