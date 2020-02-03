from django.db import models
from projects.models import Projects


class Groups(models.Model):
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'groups'
