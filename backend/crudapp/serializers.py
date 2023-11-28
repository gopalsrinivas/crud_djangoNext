from rest_framework import serializers
from .models import PersonalInfo


class PersonalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalInfo
        fields = '__all__'

    def validate_email(self, value):
        if self.instance and PersonalInfo.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Email must be unique.")
        return value

    def validate_mobile(self, value):
        if self.instance and PersonalInfo.objects.filter(mobile=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Mobile number must be unique.")
        return value
    
