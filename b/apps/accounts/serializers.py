from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import Company, Profile
from django.utils.translation import get_language
from .email_utils import send_localized_email
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from django.conf import settings
User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["user_id"] = user.id
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        # 👇 Embed company as JSON object
        company = getattr(user, "company", None)
        if company:
            token["company"] = {
                "id": company.id,
                "name": getattr(company, "name", None),
            }
        else:
            token["company"] = None

        return token

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Django's `authenticate` expects username field, which is email in your model
        user = authenticate(username=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_email_verified:
            raise serializers.ValidationError("Email not verified.")
        return user

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        role = validated_data.get("role")
        company = validated_data.get("company")
        company_name = (
            "getajob" if role == "employer" else "jenijob"
        )
        company, _ = Company.objects.get_or_create(name=company_name)
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=role,
            company=company if role == "employer" else None,
        )
        user.save()
        return user
    

    def create(self, validated_data):
            lang = get_language()
            user = User.objects.create_user(**validated_data)
            profile, _ = Profile.objects.get_or_create(user=user)

            code = get_random_string(6, "0123456789")
            profile.email_code = code
            profile.save()

            context = {
                "user": user,
                "code": code,
                "FRONTEND_URL": settings.FRONTEND_URL,
            }

            send_localized_email(
                user=user,
                template_name="verify_email",
                context=context,
                language=lang,  # from middleware
            )

            return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value

    def save(self):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        code = get_random_string(6, allowed_chars="0123456789")
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.reset_code = code
        profile.save()

        send_localized_email(
            user,
            "reset_password",
            {"user": user, "code": code, "FRONTEND_URL": settings.FRONTEND_URL},
            language=get_language(),
        )
        return user


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        user = User.objects.filter(email=data["email"]).first()
        if not user:
            raise serializers.ValidationError("Invalid email or code.")

        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.reset_code != data["code"]:
            raise serializers.ValidationError("Invalid or expired code.")
        return data

    def save(self):
        user = User.objects.get(email=self.validated_data["email"])
        profile = user.profile  # should exist now

        user.set_password(self.validated_data["new_password"])
        profile.reset_code = None
        user.save()
        profile.save()
        return user

class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = User.objects.filter(email=attrs["email"]).first()
        if not user or getattr(user, "reset_code", None) != attrs["code"]:
            raise serializers.ValidationError("Invalid code.")
        if timezone.now() > getattr(user, "reset_code_expires", timezone.now()):
            raise serializers.ValidationError("Code expired.")
        return attrs

    def save(self):
        user = User.objects.get(email=self.validated_data["email"])
        user.set_password(self.validated_data["new_password"])
        user.reset_code = None
        user.reset_code_expires = None
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect current password.")
        return value

    def validate_new_password(self, value):
        # Optional: enforce Django’s password validators
        from django.contrib.auth.password_validation import validate_password
        validate_password(value)
        return value
    

class LogoutSerializer(serializers.Serializer):
    detail = serializers.CharField(read_only=True)