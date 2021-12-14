# Generated by Django 3.1.9 on 2021-12-13 05:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0004_datasetframe'),
    ]

    operations = [
        migrations.AddField(
            model_name='labeldataset',
            name='version_major',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='labeldataset',
            name='version_minor',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='labeldataset',
            name='version_patch',
            field=models.IntegerField(default=0),
        ),
    ]
