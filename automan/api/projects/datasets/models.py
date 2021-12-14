# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone
from projects.models import Projects
from projects.originals.models import DatasetCandidate


class LabelDataset(models.Model):
    original = models.IntegerField(default=-1)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    file_path = models.CharField(max_length=255, default='')
    name = models.CharField(max_length=100, default='')
    frame_count = models.IntegerField(default=-1)
    version_major = models.IntegerField(default=0)
    version_minor = models.IntegerField(default=0)
    version_patch = models.IntegerField(default=0)
    project = models.ForeignKey(Projects, null=True, on_delete=models.CASCADE)


class DatasetDatasetCandidate(models.Model):
    dataset = models.ForeignKey(LabelDataset, on_delete=models.CASCADE)
    dataset_candidate = models.ForeignKey(DatasetCandidate, on_delete=models.CASCADE)
