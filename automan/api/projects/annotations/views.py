# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view
from .annotation_manager import AnnotationManager
from projects.datasets.dataset_manager import DatasetManager
from projects.originals.original_manager import OriginalManager
from projects.storages.serializer import StorageSerializer
from projects.storages.aws_s3 import AwsS3Client
from api.permissions import Permission
from api.settings import PER_PAGE, SORT_KEY
from accounts.account_manager import AccountManager
from api.errors import UnknownStorageTypeError


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
        return HttpResponse(status=201, content=json.dumps(contents), content_type='application/json')


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
        return HttpResponse(status=201, content=json.dumps({}), content_type='application/json')

    else:
        if not Permission.hasPermission(user_id, 'delete_annotationwork', project_id):
            raise PermissionDenied
        dataset_id = annotation_manager.get_annotation(annotation_id)['dataset_id']
        original_id = DatasetManager().get_dataset(user_id, dataset_id)['original_id']
        storage_id = OriginalManager().get_original(project_id, original_id)['storage_id']
        storage = StorageSerializer().get_storage(project_id, storage_id)
        annotation_manager.delete_annotation(annotation_id, storage)
        return HttpResponse(status=204)


@api_view(['GET', 'POST'])
def frame(request, project_id, annotation_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    if request.method == 'GET':
        if not Permission.hasPermission(user_id, 'get_label', project_id):
            raise PermissionDenied
        try_lock = (request.GET.get(key='try_lock') == 'true')
        labels = annotation_manager.get_frame_labels(
            project_id, user_id, try_lock, annotation_id, frame)
        return HttpResponse(content=json.dumps(labels), status=200, content_type='application/json')

    else:
        if not Permission.hasPermission(user_id, 'create_label', project_id):
            raise PermissionDenied
        created = request.data.get('created', "")
        edited = request.data.get('edited', "")
        deleted = request.data.get('deleted', "")
        annotation_manager.set_frame_label(user_id, project_id, annotation_id, frame, created, edited, deleted)
        return HttpResponse(status=201, content=json.dumps({}), content_type='application/json')

@api_view(['GET'])
def closest_active_frame(request, project_id, annotation_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    if not Permission.hasPermission(user_id, 'get_label', project_id):
        raise PermissionDenied
    next_frame = annotation_manager.get_active_frame(project_id, user_id, annotation_id, frame, False)
    prev_frame = annotation_manager.get_active_frame(project_id, user_id, annotation_id, frame, True)
    result = {
        'next_frame': next_frame,
        'prev_frame': prev_frame
    }
    return HttpResponse(content=json.dumps(result), status=200, content_type='application/json')


@api_view(['GET'])
def download_archived_link(request, project_id, annotation_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    dataset_id = annotation_manager.get_annotation(annotation_id)['dataset_id']
    original_id = DatasetManager().get_dataset(user_id, dataset_id)['original_id']
    storage_id = OriginalManager().get_original(project_id, original_id)['storage_id']
    storage = StorageSerializer().get_storage(project_id, storage_id)
    if storage['storage_type'] == 'LOCAL_NFS':
        content = request.build_absolute_uri(request.path) + 'local/'
    elif storage['storage_type'] == 'AWS_S3':
        archive_path = annotation_manager.get_archive_path(annotation_id)
        content = AwsS3Client().get_s3_down_url(
            storage['storage_config']['bucket'], archive_path)
    else:
        raise UnknownStorageTypeError
    return HttpResponse(status=200, content=content, content_type='text/plain')


@api_view(['GET'])
def download_local_nfs_archive(request, project_id, annotation_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'get_label', project_id):
        raise PermissionDenied
    annotation_manager = AnnotationManager()
    archive_path = annotation_manager.get_archive_path(annotation_id)
    archive = open(archive_path, "rb").read()
    return HttpResponse(archive, content_type="application/octet-stream")


@api_view(['GET'])
def instances(request, project_id, annotation_id):
    annotation_manager = AnnotationManager()
    contents = annotation_manager.get_instances(annotation_id)
    return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')


@api_view(['GET'])
def instance(request, project_id, annotation_id, instance_id):
    annotation_manager = AnnotationManager()
    contents = annotation_manager.get_instance(annotation_id, instance_id)
    return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')


@api_view(['DELETE'])
def unlock(request, project_id, annotation_id):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    annotation_manager = AnnotationManager()
    is_ok = annotation_manager.release_lock(user_id, annotation_id)
    if is_ok:
        return HttpResponse(status=204)
    return HttpResponse(status=404)
