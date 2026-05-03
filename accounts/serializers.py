from rest_framework import serializers
from .models import User, Faculty, Department

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(queryset=Faculty.objects.all(), source='faculty_ref', required=False, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), source='department_ref', required=False, allow_null=True)

    def validate_password(self, value):
        import re
        if len(value) <= 6:
            raise serializers.ValidationError("รหัสผ่านต้องมีความยาวมากกว่า 6 ตัวอักษร")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว")
        return value

    class Meta:
        model = User
        fields = [
            'student_id', 'email', 'password',
            'prefix', 'first_name', 'last_name',
            'faculty_id', 'department_id', 'occupation', 'company'
        ]
        extra_kwargs = {
            'prefix': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'occupation': {'required': False},
            'company': {'required': False},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            student_id=validated_data['student_id'],
            email=validated_data['email'],
            password=validated_data['password'],
            prefix=validated_data.get('prefix', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            faculty_ref=validated_data.get('faculty_ref', None),
            department_ref=validated_data.get('department_ref', None),
            occupation=validated_data.get('occupation', ''),
            company=validated_data.get('company', ''),
        )
        return user