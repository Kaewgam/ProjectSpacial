from rest_framework import serializers
from .models import User, Faculty, Department, UserProfile, UserEducation, UserCareer

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    prefix = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    faculty_id = serializers.PrimaryKeyRelatedField(queryset=Faculty.objects.all(), required=False, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    occupation = serializers.CharField(required=False, allow_blank=True)
    company = serializers.CharField(required=False, allow_blank=True)

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
            'student_id', 'password',
            'email', 'prefix', 'first_name', 'last_name',
            'faculty_id', 'department_id', 'occupation', 'company'
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            student_id=validated_data['student_id'],
            password=validated_data['password'],
        )
        
        # Create Profile
        UserProfile.objects.create(
            user=user,
            email=validated_data.get('email', ''),
            prefix=validated_data.get('prefix', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create Education
        faculty = validated_data.get('faculty_id')
        department = validated_data.get('department_id')
        if faculty or department:
            UserEducation.objects.create(
                user=user,
                faculty_ref=faculty,
                department_ref=department
            )
            
        # Create Career
        occupation = validated_data.get('occupation')
        company = validated_data.get('company')
        if occupation or company:
            UserCareer.objects.create(
                user=user,
                occupation=occupation or '',
                company=company or '',
                is_current=True
            )
            
        return user