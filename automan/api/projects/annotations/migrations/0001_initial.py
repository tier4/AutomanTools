# Generated by Django 2.2.2 on 2019-08-28 04:50

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
        ('datasets', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Annotation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='', max_length=127)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('delete_flag', models.BooleanField(default=False)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='datasets.LabelDataset')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Projects')),
            ],
        ),
        migrations.CreateModel(
            name='DatasetObject',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('frame', models.IntegerField(default=0)),
                ('annotation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='annotations.Annotation')),
            ],
        ),
        migrations.CreateModel(
            name='DatasetObjectAnnotation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('delete_flag', models.BooleanField(default=False)),
                ('name', models.CharField(max_length=45)),
                ('content', models.CharField(max_length=511)),
                ('object', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='annotations.DatasetObject')),
            ],
        ),
        migrations.CreateModel(
            name='ArchivedLabelDataset',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file_path', models.CharField(default='', max_length=255)),
                ('file_name', models.CharField(default='', max_length=255)),
                ('date', models.DateTimeField(default=django.utils.timezone.now)),
                ('progress', models.IntegerField(default=0)),
                ('delete_flag', models.BooleanField(default=False)),
                ('annotation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='annotations.Annotation')),
            ],
        ),
        migrations.CreateModel(
            name='AnnotationProgress',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.IntegerField()),
                ('state', models.CharField(max_length=45)),
                ('progress', models.IntegerField(default=0)),
                ('frame_progress', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('annotation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='annotations.Annotation')),
            ],
        ),
    ]