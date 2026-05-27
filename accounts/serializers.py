from rest_framework import serializers
from .models import User, Faculty, Department, UserProfile, UserEducation, UserCareer, HallOfFame

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    prefix = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    faculty_id = serializers.PrimaryKeyRelatedField(queryset=Faculty.objects.all(), required=False, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    other_faculty = serializers.CharField(required=False, allow_blank=True)
    other_department = serializers.CharField(required=False, allow_blank=True)
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
            'faculty_id', 'department_id', 'other_faculty', 'other_department', 'occupation', 'company'
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
        other_faculty = validated_data.get('other_faculty', '')
        other_department = validated_data.get('other_department', '')
        
        if faculty or department or other_faculty or other_department:
            UserEducation.objects.create(
                user=user,
                faculty_ref=faculty,
                department_ref=department,
                other_faculty=other_faculty,
                other_department=other_department
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


class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='profile.first_name', read_only=True, default='')
    last_name = serializers.CharField(source='profile.last_name', read_only=True, default='')
    email = serializers.CharField(source='profile.email', read_only=True, default='')
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True, default='')
    github_link = serializers.CharField(source='profile.github_link', read_only=True, default='')
    avatar = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    graduation_year = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'student_id', 'first_name', 'last_name', 'email', 'phone_number', 'github_link', 'avatar', 'faculty', 'department', 'graduation_year', 'skills']

    def get_avatar(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

    def get_faculty(self, obj):
        edu = obj.educations.first()
        if not edu:
            return ""
        if edu.faculty_ref:
            return edu.faculty_ref.name
        return edu.other_faculty

    def get_department(self, obj):
        edu = obj.educations.first()
        if not edu:
            return ""
        if edu.department_ref:
            return edu.department_ref.name
        return edu.other_department

    def get_graduation_year(self, obj):
        edu = obj.educations.first()
        return edu.graduation_year if edu else ""

    def get_skills(self, obj):
        return [us.skill.name for us in obj.skills.all()]


class HallOfFameSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = HallOfFame
        fields = [
            'id', 'user', 'user_id', 'award_year', 'category', 'category_display',
            'title', 'description', 'image', 'created_at', 'updated_at'
        ]