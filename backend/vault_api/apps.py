from django.apps import AppConfig


class VaultApiConfig(AppConfig):
    name = 'vault_api'

    def ready(self):
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("ALTER TABLE vault_api_vaultdocument ADD COLUMN IF NOT EXISTS file_content TEXT DEFAULT '';")
        except Exception:
            pass
