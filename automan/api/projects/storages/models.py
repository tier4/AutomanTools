# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone

from projects.models import Projects


class Storage(models.Model):
    storage_type = models.CharField(max_length=45)
    storage_config = models.CharField(max_length=511)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)
