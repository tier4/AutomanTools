# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from .project_manager import ProjectManager
from projects.klassset.klassset_manager import KlasssetManager
from .serializer import ProjectSerializer
from api.settings import PER_PAGE, SORT_KEY
from api.permissions import Permission
from accounts.account_manager import AccountManager
from projects.storages.serializer import StorageSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    lookup_field = 'project_id'

    def list(self, request):
        username = request.user
        project_manager = ProjectManager()
        user_id = AccountManager.get_id_by_username(username)
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = project_manager.get_projects(
            user_id, sort_key, is_reverse, per_page, page, search_keyword)

        return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')

    @transaction.atomic
    def create(self, request):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        name = request.data.get('name', None)

        # create project
        serializer = ProjectSerializer(data={
            'name': name,
            'description': request.data.get('description', None),
            'label_type': request.data.get('label_type', None),
            'owner_id': user_id
        })
        if not serializer.is_valid():
            raise ValidationError
        serializer.save()

        # create klassset
        project_manager = ProjectManager()
        project_id = project_manager.get_project_id_by_name(name)
        klassset_manager = KlasssetManager()
        klassset = request.data.get('klasses')
        klassset_manager.set_klassset(project_id, user_id, klassset)

        # create storage
        storage = StorageSerializer(data={
            'storage_type': request.data.get('storage_type', None),
            'storage_config': json.dumps(request.data.get('storage_config', None)),
            'project': project_id
        })
        if not storage.is_valid():
            raise ValidationError
        storage.save()

        return HttpResponse(status=201, content={}, content_type='application/json')

    def retrieve(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        project_manager = ProjectManager()
        if not Permission.hasPermission(user_id, 'get_project', project_id):
            raise PermissionDenied
        contents = project_manager.get_project(project_id, user_id)
        return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')

    def destroy(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        project_manager = ProjectManager()
        if not Permission.hasPermission(user_id, 'delete_project', project_id):
            raise PermissionDenied
        project_manager.delete_project(project_id, user_id)
        return HttpResponse(status=204)

    @action(detail=True, methods=['post'])
    def klassset(self, request, project_id):
        klassset_manager = KlasssetManager()
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'create_klassset', project_id):
            raise PermissionDenied
        new_klassset = json.loads(request.body.decode())
        klassset_manager.set_klassset(
            project_id, user_id, new_klassset['klasses'])
        return HttpResponse(status=201)

    @action(detail=True, methods=['get'])
    def permissions(self, request, project_id):
        print('permissions')
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        permissions = Permission.getPermissions(user_id, project_id)
        return HttpResponse(
            content=json.dumps({'permissions': permissions}),
            status=200, content_type='application/json')
