# Generated by Django 2.2.2 on 2020-01-08 06:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='labeldataset',
            name='original',
            field=models.IntegerField(default=-1),
        ),
    ]
