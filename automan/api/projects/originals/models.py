# -*- coding: utf-8 -*-
from django.db import models
from django.utils import timezone

from projects.models import Projects
from projects.storages.models import Storage


class Original(models.Model):
    name = models.CharField(max_length=255, default='')
    user_id = models.IntegerField(default=0)
    size = models.BigIntegerField()
    file_type = models.CharField(max_length=127, default='rosbag')
    registered_at = models.DateTimeField(default=timezone.now)
    uploaded_at = models.DateTimeField(null=True)
    analyzed_at = models.DateTimeField(null=True)
    canceled_at = models.DateTimeField(null=True)
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)
    storage = models.ForeignKey(Storage, on_delete=models.CASCADE)
    status = models.CharField(max_length=127, default='registered')


class FileType(models.Model):
    name = models.CharField(max_length=255, default='')


class RelatedFile(models.Model):
    rosbag = models.ForeignKey(Original, on_delete=models.CASCADE)
    file_type = models.ForeignKey(FileType, blank=True, null=True, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255, default='')
    file_path = models.CharField(max_length=255, default='')


class Topic(models.Model):
    name = models.CharField(max_length=255, default='')
    type = models.CharField(max_length=255, default='')
    messages = models.IntegerField()


class RosbagTopic(models.Model):
    rosbag = models.ForeignKey(Original, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)


class DatasetCandidate(models.Model):
    original = models.IntegerField()
    data_type = models.CharField(max_length=255, default='')
    frame_count = models.IntegerField()
    analyzed_info = models.CharField(max_length=255, default='')
    #TODO: add calibration_type
    calibration_info = models.CharField(max_length=255, default='')

