from django.db import models
from projects.models import Projects
from projects.groups.models import Groups
from django.contrib.auth.models import User


class Members(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Groups, on_delete=models.CASCADE)
    project = models.ForeignKey(Projects, on_delete=models.CASCADE)

    class Meta:
        db_table = 'members'
        unique_together = ('user', 'project')
