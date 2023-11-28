from django.contrib import admin
from .models import PersonalInfo

class PersonalInfoAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'is_active')
    list_filter = ('name', 'is_active')
    ordering = ("-id",)

admin.site.register(PersonalInfo, PersonalInfoAdmin)
