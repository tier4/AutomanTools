from django.db import models
from projects.datasets.models import LabelDataset


class DatasetFrame(models.Model):
    dataset = models.ForeignKey(LabelDataset, on_delete=models.CASCADE)
    frame_number = models.BigIntegerField()
    secs = models.BigIntegerField(null=True)
    nsecs = models.IntegerField(null=True)
