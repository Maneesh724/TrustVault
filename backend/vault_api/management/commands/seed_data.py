from django.core.management.base import BaseCommand
from django.utils import timezone
from vault_api.models import (
    CustomUser, VaultDocument, DocumentVersion, DocumentGrant,
    AuditRecord, AdminNotification, SecurityPolicy, ThreatAlert, MobileOTP
)


class Command(BaseCommand):
    help = 'Seeds ONLY Admin and Owner personas; cleans out all other mock data for live operations.'

    def handle(self, *args, **options):
        self.stdout.write("Purging all mock data and non-core demo credentials...")

        # Remove all documents, grants, versions, audit records, notifications, OTPs
        DocumentGrant.objects.all().delete()
        DocumentVersion.objects.all().delete()
        VaultDocument.objects.all().delete()
        AuditRecord.objects.all().delete()
        AdminNotification.objects.all().delete()
        MobileOTP.objects.all().delete()
        ThreatAlert.objects.all().delete()

        # Delete all users EXCEPT admin@trustvault.com and sarah@trustvault.com
        CustomUser.objects.exclude(email__in=['admin@trustvault.com', 'sarah@trustvault.com']).delete()

        # Ensure Admin exists
        admin, created = CustomUser.objects.get_or_create(
            email='admin@trustvault.com',
            defaults={
                'id': 'user-002',
                'name': 'John Doe',
                'role': 'ADMIN',
                'department': 'Platform Administration',
                'phone': '+15552348901',
                'phone_verified': True,
                'status': 'ACTIVE',
                'is_staff': True,
                'is_superuser': True,
                'avatar_url': 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe',
            }
        )
        admin.set_password('Password@123')
        admin.status = 'ACTIVE'
        admin.email_verified = True
        admin.phone_verified = True
        admin.save()
        self.stdout.write(f"  [OK] Administrator ready: {admin.email} (Password@123)")

        # Ensure Document Owner exists
        owner, created = CustomUser.objects.get_or_create(
            email='sarah@trustvault.com',
            defaults={
                'id': 'user-001',
                'name': 'Sarah Wilson',
                'role': 'OWNER',
                'department': 'Enterprise Security',
                'phone': '+15557893412',
                'phone_verified': True,
                'status': 'ACTIVE',
                'avatar_url': 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Wilson',
            }
        )
        owner.set_password('Password@123')
        owner.status = 'ACTIVE'
        owner.email_verified = True
        owner.phone_verified = True
        owner.save()
        self.stdout.write(f"  [OK] Document Owner ready: {owner.email} (Password@123)")

        # Ensure standard security policies exist
        policies = [
            ('Role-Based Access Control (RBAC)', 'Enforces strict principal separation between Admin, Owner, and Viewer roles with principle of least privilege.', 'ACCESS_CONTROL', 'T-01'),
            ('Zero-Trust Document Watermarking', 'Dynamically overlays user email, timestamp, and IP signature onto rendered documents to deter screenshots and exfiltration.', 'DATA_LOSS_PREVENTION', 'T-02'),
            ('Argon2id Memory-Hard Credential Hashing', 'Utilizes memory-hard Argon2id with 64MB memory cost to prevent GPU/ASIC rainbow attacks.', 'AUTHENTICATION', 'T-03'),
            ('Tamper-Evident Append-Only Audit Ledger', 'Protects compliance records from administrative deletion or history modification.', 'ACCESS_CONTROL', 'T-04'),
        ]
        for name, desc, cat, tref in policies:
            SecurityPolicy.objects.get_or_create(
                name=name,
                defaults={'description': desc, 'category': cat, 'threat_ref': tref, 'enabled': True}
            )

        self.stdout.write(self.style.SUCCESS("Database reset: ONLY Admin and Owner remain. All mock data cleared for live operations."))
