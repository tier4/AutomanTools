# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.decorators import api_view
from .dataset_manager import DatasetManager
from .frames.frame_manager import DatasetFrameManager
from .serializer import DatasetSerializer
from api.settings import PER_PAGE, SORT_KEY
from api.permissions import Permission
from api.errors import UnknownStorageTypeError
from accounts.account_manager import AccountManager
from projects.originals.original_manager import OriginalManager
from projects.storages.serializer import StorageSerializer
from projects.storages.aws_s3 import AwsS3Client


class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetSerializer
    lookup_field = 'dataset_id'

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        dataset_manager = DatasetManager()
        if not Permission.hasPermission(user_id, 'list_dataset', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = dataset_manager.get_datasets(
            project_id, user_id, sort_key, is_reverse, per_page, page, search_keyword)
        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')

    def create(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        dataset_manager = DatasetManager()
        if not Permission.hasPermission(user_id, 'create_dataset', project_id):
            raise PermissionDenied
        name = request.data.get('name')
        file_path = request.data.get('file_path')
        frame_count = int(request.data.get('frame_count'))
        original_id = request.data.get('original_id', None)
        candidates = request.data.get('candidates')
        frames = request.data.get('frames')
        dataset_id = dataset_manager.create_dataset(name, file_path, frame_count, original_id, project_id, candidates)
        frames = DatasetFrameManager.create_dataset_frame(dataset_id, frames)

        contents = dataset_manager.get_dataset(user_id, dataset_id)
        return HttpResponse(status=201,
                            content=json.dumps(contents),
                            content_type='application/json')

    def retrieve(self, request, project_id, dataset_id):
        username = request.user
        dataset_manager = DatasetManager()
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'get_dataset', project_id):
            raise PermissionDenied
        contents = dataset_manager.get_dataset(user_id, dataset_id)
        return HttpResponse(content=json.dumps(contents),
                            status=200,
                            content_type='application/json')

    def destroy(self, request, project_id, dataset_id):
        username = request.user
        dataset_manager = DatasetManager()
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'delete_dataset', project_id):
            raise PermissionDenied
        original_id = DatasetManager().get_dataset(user_id, dataset_id)['original_id']
        storage_id = OriginalManager().get_original(project_id, original_id)['storage_id']
        storage = StorageSerializer().get_storage(project_id, storage_id)
        dataset_manager.delete_dataset(user_id, dataset_id, storage)
        return HttpResponse(status=204)


def __get_extension(candidate_id):
    candidate = OriginalManager().get_dataset_candidate(candidate_id)
    msg_type = json.loads(candidate['analyzed_info'])['msg_type']
    if msg_type == 'sensor_msgs/PointCloud2':
        return '.pcd'
    return '.jpg'


@api_view(['GET'])
def get_frame(request, project_id, dataset_id, candidate_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'get_annotationwork', project_id):
        raise PermissionDenied

    dataset = DatasetManager().get_dataset(user_id, dataset_id)
    original = OriginalManager().get_original(project_id, dataset['original_id'])
    storage = StorageSerializer().get_storage(project_id, original['storage_id'])

    if storage['storage_type'] == 'LOCAL_NFS':
        image_link = request.build_absolute_uri(request.path) + 'image/'
    elif storage['storage_type'] == 'AWS_S3':
        ext = __get_extension(candidate_id)
        key = (dataset['file_path']
               + candidate_id + '_' + str(frame).zfill(6) + ext)
        image_link = AwsS3Client().get_s3_down_url(
            storage['storage_config']['bucket'], key)
    else:
        raise UnknownStorageTypeError

    frame = DatasetFrameManager.get_dataset_frame(project_id, dataset_id, frame, storage['storage_type'])

    content = {
        'image_link': image_link,
        'frame': frame['frame']
    }
    return HttpResponse(status=200, content=json.dumps(content), content_type='application/json')


@api_view(['GET'])
def download_link(request, project_id, dataset_id, candidate_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'get_annotationwork', project_id):
        raise PermissionDenied

    dataset = DatasetManager().get_dataset(user_id, dataset_id)
    original = OriginalManager().get_original(project_id, dataset['original_id'])
    storage = StorageSerializer().get_storage(project_id, original['storage_id'])

    if storage['storage_type'] == 'LOCAL_NFS':
        content = request.build_absolute_uri(request.path) + 'image/'
    elif storage['storage_type'] == 'AWS_S3':
        ext = __get_extension(candidate_id)
        key = (dataset['file_path']
               + candidate_id + '_' + str(frame).zfill(6) + ext)
        content = AwsS3Client().get_s3_down_url(
            storage['storage_config']['bucket'], key)
    else:
        raise UnknownStorageTypeError
    return HttpResponse(status=200, content=content, content_type='text/plain')


@api_view(['GET'])
def download_local_nfs_image(request, project_id, dataset_id, candidate_id, frame):
    username = request.user
    user_id = AccountManager.get_id_by_username(username)
    if not Permission.hasPermission(user_id, 'get_annotationwork', project_id):
        raise PermissionDenied

    dataset_dir = DatasetManager().get_dataset_file_path(user_id, dataset_id)
    ext = __get_extension(candidate_id)
    file_path = dataset_dir + candidate_id + '_' + str(frame).zfill(6) + ext
    image = open(file_path, "rb").read()

    if ext == '.pcd':
        return HttpResponse(image, content_type="application/octet-stream")
    return HttpResponse(image, content_type="image/jpeg")
