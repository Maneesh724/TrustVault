from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vault_api', '0002_emailotp_customuser_email_verified_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vaultdocument',
            name='file_content',
            field=models.TextField(blank=True, default=''),
        ),
    ]
