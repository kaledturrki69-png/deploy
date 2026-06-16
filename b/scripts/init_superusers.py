import os
from django.contrib.auth import get_user_model

User = get_user_model()

def ensure_superuser(email: str, password: str):
    if not User.objects.filter(email=email).exists():
        print(f"🧩 Creating superuser: {email}")
        User.objects.create_superuser(
            email=email,
            password=password,
        )
    else:
        print(f"✅ Superuser already exists: {email}")

def run():
    ensure_superuser("adnane.benyoussef@gmail.com", "getajob@2025!;")
    ensure_superuser("elhamad.ismail@gmail.com", "getajob@2025!;")
    ensure_superuser("trabelsi.ayoub1998@gmail.com", "getajob@2025!;")
    ensure_superuser("farhat.meh@gmail.com", "getajob@2025!;")
    
if __name__ == "__main__":
    run()
