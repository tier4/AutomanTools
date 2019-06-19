# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework import viewsets
from .serializer import StorageSerializer
from api.permissions import Permission
from api.settings import PER_PAGE, SORT_KEY
from accounts.account_manager import AccountManager


class StorageViewSet(viewsets.ModelViewSet):
    serializer_class = StorageSerializer
    lookup_field = 'storage_id'

    def create(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'create_storage', project_id):
            raise PermissionDenied

        serializer = StorageSerializer(data={
            'storage_type': request.data.get('storage_type', None),
            'storage_config': json.dumps(request.data.get('storage_config', None)),
            'project': project_id
        })
        if not serializer.is_valid():
            raise ValidationError
        content = serializer.save()
        return HttpResponse(status=201, content=content, content_type='application/json')

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)

        if not Permission.hasPermission(user_id, 'list_storage', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = StorageSerializer.list(project_id, sort_key, is_reverse, per_page, page, search_keyword)
        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')
