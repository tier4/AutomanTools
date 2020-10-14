# -*- coding: utf-8 -*-
import json
import traceback
from django.http import HttpResponse
from .original_manager import OriginalManager
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view
from api.permissions import Permission
from api.settings import PER_PAGE, SORT_KEY
from accounts.account_manager import AccountManager
from utility.service_log import ServiceLog

# file upload
from api.helpers.response import JSONResponse, response_mimetype


@api_view(['GET', 'POST'])
def index(request, project_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    original_manager = OriginalManager()
    if request.method == 'POST':
        if not Permission.hasPermission(user_id, 'create_original', project_id):
            raise PermissionDenied
        name = request.data['name']
        file_type = request.data['file_type']
        size = request.data['size']
        storage_id = int(request.data['storage_id'])
        contents = original_manager.register_original(int(project_id), user_id, name, file_type, size, storage_id)
        return HttpResponse(content=json.dumps(contents),
                            status=201,
                            content_type='application/json')
    else:
        if not Permission.hasPermission(user_id, 'list_original', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")
        status = request.GET.get(key="status", default="")
        contents = original_manager.get_originals(
            project_id, sort_key, is_reverse, per_page, page, search_keyword, status)
        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')


@api_view(['POST'])
def file_upload(request, project_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'create_original', project_id):
        raise PermissionDenied
    try:
        file = request.FILES['file']
        original_manager = OriginalManager()
        data = original_manager.save_file(project_id, file)
        response = JSONResponse(data, mimetype=response_mimetype(request))
        response['Content-Disposition'] = 'inline; filename=files.json'
        return response

    except Exception:  # FIXME
        ServiceLog.error(traceback.format_exc())
        data = json.dumps({'status': 'NG'})
        return HttpResponse(
            content=data, status=400, content_type='application/json')


@api_view(['GET', 'DELETE', 'PUT'])
def original_info(request, project_id, original_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    original_manager = OriginalManager()
    if request.method == 'GET':
        if not Permission.hasPermission(user_id, 'get_original', project_id):
            raise PermissionDenied
        contents = original_manager.get_original(project_id, original_id)

        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')
    elif request.method == 'PUT':
        if not Permission.hasPermission(user_id, 'modify_original', project_id):
            raise PermissionDenied
        # TODO: status validation
        status = request.data.get('status')
        if status == 'analyzed':
            dataset_candidates = request.data.get('dataset_candidates')
            original_manager.update_status(original_id, status, dataset_candidates)
        else:
            original_manager.update_status(original_id, status)
        return HttpResponse(status=204)
    else:
        user_id = AccountManager.get_id_by_username(username)
        original_manager.delete_rosbag(project_id, user_id, original_id)
        return HttpResponse(status=204)


@api_view(['GET'])
def candidate_info(request, project_id, original_id):
    data_type = request.GET.get(key="data_type", default="")
    original_manager = OriginalManager()
    contents = original_manager.get_dataset_candidates(project_id, original_id, data_type)
    return HttpResponse(content=json.dumps(contents),
                        status=200,
                        content_type='application/json')
