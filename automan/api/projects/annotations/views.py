# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view
from .annotation_manager import AnnotationManager
from api.permissions import Permission
from api.settings import PER_PAGE, SORT_KEY
from accounts.account_manager import AccountManager


@api_view(['GET', 'POST'])
def annotations(request, project_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    if request.method == 'GET':
        if not Permission.hasPermission(user_id, 'list_annotationwork', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = annotation_manager.list_annotations(project_id, sort_key, is_reverse, per_page, page, search_keyword)

        return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')
    else:
        if not Permission.hasPermission(user_id, 'create_annotationwork', project_id):
            raise PermissionDenied

        name = request.data.get('name')
        dataset_id = request.data.get('dataset_id')

        annotation_id = annotation_manager.create_annotation(user_id, project_id, name, dataset_id)

        contents = annotation_manager.get_annotation(annotation_id)
        return HttpResponse(status=201, content=contents, content_type='application/json')


@api_view(['GET', 'POST', 'DELETE'])
def annotation(request, project_id, annotation_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    if request.method == 'GET':
        if not Permission.hasPermission(user_id, 'get_annotationwork', project_id):
            raise PermissionDenied
        contents = annotation_manager.get_annotation(annotation_id)
        return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')

    elif request.method == 'POST':
        file_path = request.data.get('file_path')
        file_name = request.data.get('file_name')
        annotation_manager.set_archive(annotation_id, file_path, file_name)
        return HttpResponse(status=201)

    else:
        if not Permission.hasPermission(user_id, 'delete_annotationwork', project_id):
            raise PermissionDenied
        annotation_manager.delete_annotation(annotation_id)
        return HttpResponse(status=204)


@api_view(['GET', 'POST'])
def frame(request, project_id, annotation_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    if request.method == 'GET':
        if not Permission.hasPermission(user_id, 'get_label', project_id):
            raise PermissionDenied
        labels = annotation_manager.get_frame_labels(
            project_id, annotation_id, frame)
        return HttpResponse(content=json.dumps(labels), status=200, content_type='application/json')

    else:
        if not Permission.hasPermission(user_id, 'create_label', project_id):
            raise PermissionDenied
        created = request.data.get('created', "")
        edited = request.data.get('edited', "")
        deleted = request.data.get('deleted', "")
        annotation_manager.set_frame_label(user_id, project_id, annotation_id, frame, created, edited, deleted)
        return HttpResponse(status=201)


@api_view(['GET'])
def download_archived_annotation(request, project_id, annotation_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'get_label', project_id):
        raise PermissionDenied
    annotation_manager = AnnotationManager()
    archive_path = annotation_manager.get_archive_path(annotation_id)
    archive = open(archive_path, "rb").read()
    return HttpResponse(archive, content_type="application/octet-stream")
