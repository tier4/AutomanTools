# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied, ValidationError
from rest_framework import viewsets
from .serializer import MemberSerializer
from api.permissions import Permission
from accounts.account_manager import AccountManager


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    lookup_field = 'member_id'

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'list_member', project_id):
            raise PermissionDenied

        content = MemberSerializer.list(project_id)
        return HttpResponse(content=json.dumps(content),
                            status=200,
                            content_type='application/json')

    def create(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'create_member', project_id):
            raise PermissionDenied

        member_username = request.data.get('username')
        member_user_id = AccountManager.get_id_by_username(member_username)
        # FIXME: Validate group_id
        serializer = MemberSerializer(data={
            'project': int(project_id),
            'user': int(member_user_id),
            'group': int(request.data.get('group_id', None)),
        })
        if not serializer.is_valid():
            raise ValidationError
        serializer.save()
        return HttpResponse(content=json.dumps(serializer.data), status=200, content_type='application/json')

    def destroy(self, request, project_id, member_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'delete_member', project_id):
            raise PermissionDenied
        # FIXME: Validate group_id
        MemberSerializer.destroy(project_id, member_id, int(request.data.get('group_id', None)))
        return HttpResponse(status=204)
