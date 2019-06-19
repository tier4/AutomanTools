# -*- coding: utf-8 -*-
import json
import os
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied, ValidationError
from rest_framework import viewsets
from .serializer import CalibrationSerializer
from api.helpers.response import JSONResponse, response_mimetype
from api.settings import PER_PAGE, SORT_KEY
from api.permissions import Permission
from accounts.account_manager import AccountManager
from .helpers.validator import parse_calib


class CalibrationViewSet(viewsets.ModelViewSet):
    serializer_class = CalibrationSerializer
    lookup_field = 'calibration_id'

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'list_calibration', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = CalibrationSerializer.list(
            project_id, user_id, sort_key, is_reverse, per_page, page, search_keyword)
        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')

    def create(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'create_calibration', project_id):
            raise PermissionDenied
        file = request.FILES['file']
        if int(request.META['CONTENT_LENGTH']) > 2048:
            raise ValidationError()
        file_path = '/tmp/' + file.name

        # write
        with open(file_path, 'ab') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # validation
        try:
            camera_extrinsic_mat, camera_mat, dist_coeff = parse_calib(file_path)
        except Exception:
            raise ValidationError()
        serializer = CalibrationSerializer(data={
            'project': int(project_id),
            'name': file.name,
            'content': json.dumps({
                'camera_extrinsic_mat': camera_extrinsic_mat,
                'camera_mat': camera_mat,
                'dist_coeff': dist_coeff
            }),
        })
        if not serializer.is_valid():
            raise ValidationError()
        serializer.save()
        contents = {}
        os.remove(file_path)
        response = JSONResponse(contents, mimetype=response_mimetype(request))
        response['Content-Disposition'] = 'inline; filename=files.json'
        return response
