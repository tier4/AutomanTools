# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone
from projects.models import Projects


class Calibration(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=100, default='')
    content = models.CharField(max_length=1024, default='')
    project = models.ForeignKey(Projects, null=True, on_delete=models.CASCADE)
