# Generated by Django 2.2.2 on 2021-02-24 06:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('originals', '0004_auto_20201213_1811'),
    ]

    operations = [
        migrations.AddField(
            model_name='datasetcandidate',
            name='calibration_info',
            field=models.CharField(default='', max_length=255),
        ),
    ]