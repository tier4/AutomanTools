# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework import viewsets
from rest_framework.decorators import action
from .serializer import StorageSerializer
from .storage_manager import StorageManager
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
        serializer.save()
        content = StorageSerializer.list(project_id)
        return HttpResponse(status=201, content=json.dumps(content), content_type='application/json')

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

    @action(methods=['post'], detail=False)
    def upload(self, request, project_id):
        # TODO s3 validation
        storage_id = int(request.data.get('storage_id'))
        key = request.data.get('key')
        storage_manager = StorageManager(project_id, storage_id)
        bucket = storage_manager.storage['storage_config']['bucket']
        if storage_manager.original_file_exists(key):
            return HttpResponse(status=409,
                            content=json.dumps({}),
                            content_type='application/json')
        s3_info = {"bucket": bucket, "key": key}
        s3_info.update(storage_manager.get_sts())
        # set presigned url for extractor
        s3_info.update(storage_manager.get_s3_presigned_url(bucket, key))
        res = {
            'result': s3_info
        }
        return HttpResponse(content=json.dumps(res),
                            status=200,
                            content_type='application/json')
