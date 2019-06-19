from django.core.exceptions import ObjectDoesNotExist, FieldError
from django.contrib.auth.models import User
from rest_framework import serializers
from projects.groups.models import Groups
from projects.members.models import Members
from api.settings import PER_PAGE, SORT_KEY
from api.common import validation_check


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        fields = ('name', 'project')

    @classmethod
    def get_groups(cls, project_id, sort_key=SORT_KEY, is_reverse=False, per_page=PER_PAGE, page=1):
        validation_check(per_page, page)
        try:
            if is_reverse is False:
                groups = Groups.objects.order_by(sort_key).filter(
                    project_id=project_id, delete_flag=False)
            else:
                groups = Groups.objects.order_by(sort_key).reverse().filter(
                    project_id=project_id, delete_flag=False)
        except FieldError:
            groups = Groups.objects.order_by(SORT_KEY).filter(
                project_id=project_id, delete_flag=False)

        if groups is None:
            raise ObjectDoesNotExist()
        records = []
        for group in groups:
            record = {}
            record['id'] = group.id
            record['name'] = group.name
            record['members'] = cls.__get_group_users(group.id)
            records.append(record)
        contents = {}
        contents['count'] = len(groups)
        contents['records'] = records
        return contents

    @classmethod
    def __get_group_users(cls, group_id):
        group_users = Members.objects.filter(
            group_id=group_id, delete_flag=False)
        user_ids = [int(gu.user_id) for gu in group_users]
        users = User.objects.filter(id__in=user_ids, is_active=1)
        records = [{'id': user.id, 'username': user.username} for user in users]
        return records
