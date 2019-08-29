# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone

from projects.models import Projects
from projects.jobs.const import STATUS_MAP


class Job(models.Model):
    job_type = models.CharField(max_length=45)
    user_id = models.IntegerField(default=0)
    registered_at = models.DateTimeField(default=timezone.now)
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)
    job_config = models.CharField(max_length=1023)
    pod_log = models.CharField(max_length=1023, default='')
    status = models.CharField(max_length=45, default=STATUS_MAP['submitted'])
    started_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)
    unknown_started_at = models.DateTimeField(null=True)
