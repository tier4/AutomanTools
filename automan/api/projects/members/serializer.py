from django.core.exceptions import ObjectDoesNotExist
from projects.members.models import Members
from rest_framework import serializers


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Members
        fields = ('user', 'project', 'group')

    @classmethod
    def list(self, project_id):
        members = Members.objects.filter(project_id=project_id)
        if members is None:
            raise ObjectDoesNotExist()

        records = []
        for member in members:
            record = {}
            record['username'] = member.user.username
            record['groupname'] = member.group.name
            records.append(record)
        content = {
            'count': len(records),
            'records': records
        }
        return content

    @classmethod
    def destroy(cls, project_id, user_id, group_id):
        member = Members.objects.filter(
            project_id=project_id, user_id=user_id, group_id=group_id).first()
        id = member.id
        member.delete()
        return id

    @classmethod
    def get_group(cls, project_id, user_id):
        member = Members.objects.filter(
            project_id=project_id, user_id=user_id).first()
        return member.group.name
