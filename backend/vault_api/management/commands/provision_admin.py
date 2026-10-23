import os
import getpass
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from vault_api.models import CustomUser, AuditRecord

class Command(BaseCommand):
    help = 'Secure server-side bootstrap command to provision the initial TrustVault Administrator.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='admin@trustvault.com', help='Administrator corporate email address')
        parser.add_argument('--name', type=str, default='System Administrator', help='Administrator full name')
        parser.add_argument('--password', type=str, default=None, help='Administrator password (or omit to be prompted securely)')
        parser.add_argument('--phone', type=str, default='+15551234567', help='Administrator mobile phone number')
        parser.add_argument('--force', action='store_true', help='Force reset/update of existing administrator account')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        name = options['name'].strip()
        password = options['password']
        force = options['force']

        if not password:
            env_pwd = os.environ.get('TRUSTVAULT_ADMIN_PASSWORD')
            if env_pwd:
                password = env_pwd
            else:
                self.stdout.write(self.style.WARNING(f"Enter secure password for administrator {email}:"))
                password = getpass.getpass("Password: ")
                confirm_password = getpass.getpass("Confirm Password: ")
                if password != confirm_password:
                    raise CommandError("Passwords do not match.")

        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters long to satisfy zero-trust policy.")

        existing_admin = CustomUser.objects.filter(role='ADMIN').first()
        if existing_admin and not force:
            if existing_admin.email == email:
                raise CommandError(
                    f"Administrator {email} already exists. To securely update credentials, run with --force."
                )
            else:
                raise CommandError(
                    f"An Administrator ({existing_admin.email}) already exists. Initial bootstrap cannot be reused without --force."
                )

        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'phone': options.get('phone', '+15551234567'),
                'role': 'ADMIN',
                'status': 'ACTIVE',
                'email_verified': True,
                'phone_verified': True,
                'department': 'Information Security & Compliance',
            }
        )

        user.name = name
        user.phone = options.get('phone', user.phone or '+15551234567')
        user.role = 'ADMIN'
        user.status = 'ACTIVE'
        user.email_verified = True
        user.phone_verified = True
        user.is_staff = True
        user.set_password(password)
        user.save()

        AuditRecord.objects.create(
            actor_id=user.id,
            actor_name=user.name,
            actor_email=user.email,
            actor_role='ADMIN',
            action='ADMIN_BOOTSTRAP_PROVISIONED',
            severity='CRITICAL',
            ip_address='127.0.0.1 (CLI)',
            user_agent='TrustVault Management Command / provision_admin',
            outcome='SUCCESS',
            details={
                'provisionedEmail': email,
                'force': force,
                'timestamp': timezone.now().isoformat()
            }
        )

        action_str = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"[TRUSTVAULT SECURITY] {action_str} Administrator account successfully.\n"
            f"  Identity: {user.name} <{user.email}>\n"
            f"  Role: ADMINISTRATOR\n"
            f"  Status: ACTIVE (Email & Mobile Verified)\n"
            f"  Audit Record: Recorded to immutable ledger."
        ))
