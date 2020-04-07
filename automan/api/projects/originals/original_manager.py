import copy
import json
import shutil
import os
from datetime import datetime
from django.core.exceptions import ObjectDoesNotExist, FieldError, ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from projects.originals.models import Original, FileType, RelatedFile, DatasetCandidate
from projects.storages.serializer import StorageSerializer
from projects.storages.aws_s3 import AwsS3Client
from projects.datasets.dataset_manager import DatasetManager
from api.common import validation_check
from api.settings import SORT_KEY, PER_PAGE
from automan_website.settings import STORAGE_CONFIG


class OriginalManager(object):

    def __init__(self):
        pass

    def register_original(self, project_id, user_id, name, file_type, size, storage_id):
        new_original = Original(
            name=name,  # FIXME: name validation
            project_id=project_id,
            user_id=user_id,
            file_type=file_type,
            size=size,
            storage_id=storage_id)
        new_original.save()
        storage_config = copy.deepcopy(STORAGE_CONFIG)
        storage_config.update({'blob': name})
        original = self.get_original(project_id, new_original.id)

        storage = StorageSerializer().get_storage(project_id, original['storage_id'])
        if storage['storage_type'] == 'AWS_S3':
            config = storage['storage_config']
            key = (config['base_dir'] + '/' + 'raws' + '/' + name)
            original['post_url'] = AwsS3Client().get_s3_put_url(config['bucket'], key)
        return original

    @transaction.atomic
    def update_status(self, original_id, status, dataset_candidates=None):
        original = Original.objects.filter(id=original_id).first()
        if original is None:
            raise ObjectDoesNotExist()
        original.status = status
        if status == 'uploaded':
            original.uploaded_at = timezone.datetime.now()
        if status == 'analyzed':
            # TODO: bulk insert
            original.analyzed_at = timezone.datetime.now()
            for candidate in dataset_candidates:
                new_dataset_candidate = DatasetCandidate(
                    original=original.id,
                    frame_count=candidate['frame_count'],
                    data_type=candidate['data_type'],
                    analyzed_info=json.dumps(candidate['analyzed_info'])
                )
                new_dataset_candidate.save()
        if status == 'invalid':
            original.canceled_at = timezone.datetime.now()
        original.status = status
        original.save()

    def get_original(self, project_id, original_id, status=None):
        if status:
            original = Original.objects.filter(
                id=original_id, status=status).first()
        else:
            original = Original.objects.filter(
                id=original_id).first()
        if original is None:
            raise ObjectDoesNotExist()
        content = {
            'id': original.id,
            'name': original.name,
            'user_id': original.user_id,
            'size': original.size,
            'storage_id': original.storage_id,
            'file_type': original.file_type,
            'registered_at': str(original.registered_at),
            'uploaded_at': str(original.uploaded_at),
            'analyzed_at': str(original.analyzed_at),
            'canceled_at': str(original.canceled_at),
            'project_id': original.project.id,
            'status': original.status,
        }
        return content

    def get_originals(
            self, project_id, sort_key=SORT_KEY, is_reverse=False, per_page=PER_PAGE, page=1,
            search_keyword="", status=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                originals = Original.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword),
                    Q(status__contains=status))[begin:begin + per_page]
            else:
                originals = Original.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword),
                    Q(status__contains=status))[begin:begin + per_page]
        except FieldError:
            originals = Original.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(name__contains=search_keyword),
                Q(status__contains=status))[begin:begin + per_page]
        records = []
        for original in originals:
            record = {}
            record['id'] = original.id
            record['name'] = original.name
            record['file_type'] = original.file_type
            record['size'] = int(original.size)
            record['status'] = original.status
            if original.status == 'analyzed':
                record['dataset_candidates'] = self.get_dataset_candidates(project_id, original.id)['records']
            else:
                record['dataset_candidates'] = []
            # TODO: job_id
            records.append(record)
        contents = {}
        contents['count'] = self.original_total_count(project_id)
        contents['records'] = records
        return contents

    def get_dataset_candidates(self, project_id, original_id, data_type=""):
        dataset_candidates = DatasetCandidate.objects.filter(
            Q(original=original_id),
            Q(data_type__contains=data_type))
        records = []
        for dataset_candidate in dataset_candidates:
            record = {}
            record['candidate_id'] = dataset_candidate.id
            record['original_id'] = dataset_candidate.original
            record['data_type'] = dataset_candidate.data_type
            record['analyzed_info'] = dataset_candidate.analyzed_info
            record['frame_count'] = dataset_candidate.frame_count
            records.append(record)
        return {'count': len(records), 'records': records}

    def get_dataset_candidate(self, candidate_id):
        dataset_candidate = DatasetCandidate.objects.filter(id=candidate_id).first()
        if not dataset_candidate:
            raise ObjectDoesNotExist()

        record = {}
        record['original_id'] = dataset_candidate.original
        record['data_type'] = dataset_candidate.data_type
        record['analyzed_info'] = dataset_candidate.analyzed_info
        record['frame_count'] = dataset_candidate.frame_count
        return record

    def original_total_count(self, project_id):
        originals = Original.objects.filter(project_id=project_id)
        return originals.count()

    def save_file(self, project_id, original_id, file):
        # if target files is existed and the limit time has passed, delete it.
        original = self.get_original(project_id, original_id, status='registered')
        storage = StorageSerializer().get_storage(project_id, original['storage_id'])
        if storage['storage_type'] != 'LOCAL_NFS':
            raise ValidationError()
        dir_path = (storage['storage_config']['mount_path']
                    + storage['storage_config']['base_dir']
                    + '/' + original['name'] + '/raw/')  # FIXME: Rule Aggregation
        file_path = dir_path + file.name
        try:
            os.makedirs(dir_path)
        except Exception:
            original = Original.objects.filter(id=original_id).first()
            if original is None:
                raise ObjectDoesNotExist()
            file_name = file.name + '_' + datetime.now().strftime('%s')
            dir_path = storage['storage_config']['mount_path']
            + storage['storage_config']['base_dir']
            + '/' + file_name + '/raw/'  # FIXME: Rule Aggregation
            os.makedirs(dir_path)
            original.name = file_name
            original.save()
            file_path = dir_path + file_name

        # write
        with open(file_path, 'ab') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        return {'files': [file.name]}

    def set_file_type(self, name):
        file_type, is_succeeded = FileType.objects.get_or_create(name=name)
        return file_type

    def set_related_file(self, name, file_path, file_type, target_rosbag):
        related_file, is_success = RelatedFile.objects.get_or_create(
            file_type=file_type, rosbag=target_rosbag,
            file_name=name, file_path=file_path)
        return related_file

    def delete_rosbag(self, project_id, user_id, original_id):
        rosbag = Original.objects.filter(project_id=project_id, id=original_id).first()
        if rosbag is None:
            raise ObjectDoesNotExist()

        storage = StorageSerializer().get_storage(project_id, rosbag.storage_id)
        config = storage['storage_config']

        dataset_manager = DatasetManager()
        if dataset_manager.get_datasets_count_by_original(original_id) == 0:
            candidates = DatasetCandidate.objects.filter(original=original_id)
            for candidate in candidates:
                candidate.delete()

        rosbag.delete()
        if storage['storage_type'] == 'LOCAL_NFS':
            path = (config['mount_path'] + config['base_dir']
                    + '/' + rosbag.name + '/')
            shutil.rmtree(path)
        elif storage['storage_type'] == 'AWS_S3':
            key = config['base_dir'] + '/raws/' + rosbag.name
            AwsS3Client().delete_s3_files(config['bucket'], key)
        return True
