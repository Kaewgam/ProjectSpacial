from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'student_id', 'email', 'password',
            'prefix', 'first_name', 'last_name',
            'faculty', 'department', 'occupation',
        ]
        extra_kwargs = {
            'prefix': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'faculty': {'required': False},
            'department': {'required': False},
            'occupation': {'required': False},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            student_id=validated_data['student_id'],
            email=validated_data['email'],
            password=validated_data['password'],
            prefix=validated_data.get('prefix', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            faculty=validated_data.get('faculty', ''),
            department=validated_data.get('department', ''),
            occupation=validated_data.get('occupation', ''),
        )
        return user