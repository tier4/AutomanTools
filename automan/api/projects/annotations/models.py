# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone
from projects.datasets.models import LabelDataset
from projects.models import Projects
import uuid


class Annotation(models.Model):
    dataset = models.ForeignKey(LabelDataset, on_delete=models.CASCADE)
    name = models.CharField(max_length=127, default='')
    created_at = models.DateTimeField(default=timezone.now)
    delete_flag = models.BooleanField(default=False)
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)


class ArchivedLabelDataset(models.Model):
    file_path = models.CharField(max_length=255, default='')
    file_name = models.CharField(max_length=255, default='')
    date = models.DateTimeField(default=timezone.now)
    progress = models.IntegerField(default=0)
    delete_flag = models.BooleanField(default=False)
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE)


class AnnotationProgress(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE)
    user = models.IntegerField()
    state = models.CharField(max_length=45)
    progress = models.IntegerField(default=0)
    frame_progress = models.IntegerField(default=0)
    updated_at = models.DateTimeField(default=timezone.now)


class DatasetObject(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE)
    frame = models.IntegerField(default=0)
    instance = models.UUIDField(default=None, null=True)
    delete_flag = models.BooleanField(default=False)


class DatasetObjectAnnotation(models.Model):
    object = models.ForeignKey(DatasetObject, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=45)
    content = models.CharField(max_length=511)


class FrameLock(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE)
    frame = models.IntegerField()
    user = models.IntegerField()
    expires_at = models.DateTimeField()
