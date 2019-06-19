# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from .serializer import GroupSerializer
from api.settings import PER_PAGE, SORT_KEY
from api.permissions import Permission
from accounts.account_manager import AccountManager


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    lookup_field = 'group_id'

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'list_group', project_id):
            raise PermissionDenied

        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        contents = GroupSerializer.get_groups(
            project_id, sort_key, is_reverse, per_page, page)

        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')

    def retrieve(self, request, project_id, group_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'get_group', project_id):
            raise PermissionDenied
        content = GroupSerializer.get_group(project_id, user_id, group_id)
        return HttpResponse(content=json.dumps(content),
                            status=200,
                            content_type='application/json')
