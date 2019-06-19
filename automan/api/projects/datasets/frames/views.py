# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from .serializer import DatasetFrameSerializer
from .frame_manager import DatasetFrameManager
from api.permissions import Permission
from accounts.account_manager import AccountManager


class DatasetFrameViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetFrameSerializer
    lookup_field = 'frame_id'

    def list(self, request, project_id, dataset_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'get_dataset', project_id):
            raise PermissionDenied
        content = DatasetFrameManager.list_dataset_frames(project_id, dataset_id)
        return HttpResponse(content=json.dumps(content), status=200, content_type='application/json')

    def retrieve(self, request, project_id, dataset_id, frame_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'get_dataset', project_id):
            raise PermissionDenied
        frame = DatasetFrameManager.get_dataset_frame(project_id, dataset_id, frame_id)
        return HttpResponse(content=json.dumps(frame), status=200, content_type='application/json')
