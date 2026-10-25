from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vault_api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vaultdocument',
            name='file_content',
            field=models.TextField(blank=True, default=''),
        ),
    ]
