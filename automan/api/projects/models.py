# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone


class Projects(models.Model):
    name = models.CharField(max_length=127, unique=True)
    description = models.CharField(max_length=127)
    label_type = models.CharField(max_length=45)
    created_at = models.DateTimeField(default=timezone.now)
    owner_id = models.IntegerField()

    class Meta:
        db_table = 'projects'


class KlassSet(models.Model):
    project = models.OneToOneField(Projects, on_delete=models.CASCADE)
    user_id = models.IntegerField()
    created_at = models.DateTimeField(default=timezone.now)


class KlassKlassSet(models.Model):
    name = models.CharField(max_length=100)
    klass_set = models.ForeignKey(KlassSet, on_delete=models.CASCADE)
    config = models.TextField(null=False)
