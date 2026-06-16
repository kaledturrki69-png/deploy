from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.contrib.auth.models import Group
from django.utils.text import slugify


class Company(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    view_library = models.BooleanField(default=True)
    access_getajob_resumes = models.BooleanField(default=True)


    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class JekUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        from .models import Company
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "superadmin")

        user = self.create_user(email, password, **extra_fields)
        company, _ = Company.objects.get_or_create(name="getajob")
        user.company = company
        user.save(using=self._db)
        return user


class JekUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("candidate", "Candidate"),
        ("employer", "Employer"),
        ("superadmin", "Superadmin"),
    )

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    company = models.ForeignKey("Company", on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = JekUserManager()

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        from django.conf import settings
        from .models import Company
        if not self.company:
            if self.role == "candidate":
                self.company, _ = Company.objects.get_or_create(name=settings.DEFAULT_COMPANIES["candidate"])
            elif self.role == "employer":
                self.company, _ = Company.objects.get_or_create(name=settings.DEFAULT_COMPANIES["superuser"])
        super().save(*args, **kwargs)


class AccountGroup(Group):
    """
    Proxy model for auth.Group, so it appears under the Accounts app.
    """
    class Meta:
        proxy = True
        verbose_name = "Group"
        verbose_name_plural = "Groups"
        app_label = "accounts"

class Profile(models.Model):
    user = models.OneToOneField(JekUser, on_delete=models.CASCADE, related_name="profile")
    email_code = models.CharField(max_length=6, null=True, blank=True)
    reset_code = models.CharField(max_length=6, null=True, blank=True)

    def __str__(self):
        return f"Profile for {self.user.email}"

class Workplace(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name