import os
import copy
import json
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import FieldError, ValidationError
from rest_framework import serializers
from libs.k8s.jobs import BaseJob
from libs.k8s.jobs.annotation_archiver import AnnotationArchiver
from libs.k8s.jobs.rosbag_extractor import RosbagExtractor
from libs.k8s.jobs.rosbag_analyzer import RosbagAnalyzer
from datetime import datetime, timezone
from projects.jobs.models import Job
from projects.jobs.const import STATUS_MAP, UNKNOWN_LIMIT_TIME
from projects.project_manager import ProjectManager
from projects.originals.original_manager import OriginalManager
from projects.datasets.dataset_manager import DatasetManager
from projects.storages.serializer import StorageSerializer
from api.settings import PER_PAGE
from api.common import validation_check
from accounts.account_manager import AccountManager


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ('job_type', 'job_config')

    @classmethod
    def list_jobs(cls, project_id, sort_key, is_reverse=False, per_page=PER_PAGE, page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                jobs = Job.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(job_type__contains=search_keyword) | Q(job_config__contains=search_keyword)
                )[begin:begin + per_page]
            else:
                jobs = Job.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(job_type__contains=search_keyword) | Q(job_config__contains=search_keyword)
                )[begin:begin + per_page]
        except FieldError:
            jobs = Job.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(job_type__contains=search_keyword) | Q(job_config__contains=search_keyword)
            )[begin:begin + per_page]
        records = []
        for job in jobs:
            record = {}
            record['id'] = job.id
            record['job_type'] = job.job_type
            if job.status not in [STATUS_MAP['succeeded'], STATUS_MAP['failed']]:
                status, start_time, completion_time = cls.__get_job_status(job.id, job.job_type)
                if job.status != STATUS_MAP['unknown'] and status == STATUS_MAP['unknown']:
                    job.unknown_started_at = datetime.now(timezone.utc)
                job.status = status
                job.started_at = start_time
                job.completed_at = completion_time
                if job.status == STATUS_MAP['unknown'] and cls.__is_unknown_time_limit(job.unknown_started_at):
                    job.status = STATUS_MAP['failed']
                if job.status == STATUS_MAP['failed']:
                    namespace = cls.__generate_job_namespace()
                    pod_log = BaseJob().logs(cls.__generate_job_name(job.id, job.job_type), namespace)
                    job.pod_log = pod_log
                job.save()
            record['status'] = job.status
            record['started_at'] = str(job.started_at) if job.started_at else ''
            record['completed_at'] = str(job.completed_at) if job.completed_at else ''
            record['registered_at'] = str(job.registered_at)
            record['job_config'] = job.job_config
            record['pod_log'] = job.pod_log
            record['user_id'] = job.user_id
            records.append(record)
        contents = {}
        contents['count'] = cls.job_total_count(project_id)
        contents['records'] = records
        return contents

    @classmethod
    def job_total_count(cls, project_id):
        jobs = Job.objects.filter(project_id=project_id)
        return jobs.count()

    @classmethod
    @transaction.atomic
    def archive(cls, user_id, project_id, dataset_id, original_id, annotation_id):
        original = OriginalManager().get_original(project_id, original_id, status='analyzed')
        storage = StorageSerializer().get_storage(project_id, original['storage_id'])
        storage_config = copy.deepcopy(storage['storage_config'])

        automan_config = cls.__get_automan_config(user_id)
        automan_config.update({'path': '/projects/' + str(project_id) + '/annotations/' + str(annotation_id) + '/'})
        archive_config = cls.__get_archive_info(user_id, project_id, dataset_id, annotation_id, original_id)
        job_config = {
            'storage_type': storage['storage_type'],
            'storage_config': storage_config,
            'automan_config': automan_config,
            'archive_config': archive_config,
        }
        job_config_json = json.dumps(job_config)
        new_job = Job(
            job_type='archiver',
            user_id=user_id,
            project_id=project_id,
            job_config=job_config_json)
        new_job.save()
        job = AnnotationArchiver(**job_config)
        job.create(cls.__generate_job_name(new_job.id, 'archiver'))
        res = job.run()
        return res

    def __get_archive_info(user_id, project_id, dataset_id, annotation_id, original_id):
        dataset = DatasetManager().get_dataset(user_id, dataset_id)
        file_path = dataset['file_path'].rsplit('/', 2)
        archive_name = file_path[1] + '_' + datetime.now().strftime('%s')
        archive_config = {
            'project_id': project_id,
            'dataset_id': dataset_id,
            'annotation_id': annotation_id,
            'original_id': original_id,
            'archive_dir': file_path[0],
            'archive_name': archive_name,
        }
        return archive_config

    @classmethod
    @transaction.atomic
    def extract(cls, user_id, project_id, original_id, candidates):
        original = OriginalManager().get_original(project_id, original_id, status='analyzed')
        storage = StorageSerializer().get_storage(project_id, original['storage_id'])
        storage_config = copy.deepcopy(storage['storage_config'])
        original_path = StorageSerializer.get_original_path(
            storage['storage_type'], storage['storage_config'], original['name'])
        storage_config.update({'path': original_path})
        output_dir = StorageSerializer.get_dataset_output_dir(
            storage['storage_type'], storage['storage_config'], original['name'], candidates)
        storage_config.update({'output_dir': output_dir})
        automan_config = cls.__get_automan_config(user_id)
        automan_config.update({'path': '/projects/' + project_id + '/datasets/'})
        raw_data_config = cls.__get_raw_data_config(project_id, original_id, candidates)
        job_config = {
            'storage_type': storage['storage_type'],
            'storage_config': storage_config,
            'automan_config': automan_config,
            'raw_data_config': raw_data_config
        }

        job_config_json = json.dumps(job_config)
        new_job = Job(
            job_type='extractor',
            user_id=user_id,
            project_id=project_id,
            job_config=job_config_json)
        new_job.save()

        if original['file_type'] == 'rosbag':
            job = RosbagExtractor(**job_config)
            job.create(cls.__generate_job_name(new_job.id, 'extractor'))
            res = job.run()
            return res
        else:
            raise ValidationError()

    @classmethod
    @transaction.atomic
    def analyze(cls, user_id, project_id, original_id):
        project = ProjectManager().get_project(project_id, user_id)
        label_type = project['label_type']
        original = OriginalManager().get_original(project_id, original_id, status='uploaded')
        storage = StorageSerializer().get_storage(project_id, original['storage_id'])
        storage_config = copy.deepcopy(storage['storage_config'])
        original_path = StorageSerializer.get_original_path(
            storage['storage_type'], storage['storage_config'], original['name'])
        storage_config.update({'path': original_path})
        automan_config = cls.__get_automan_config(user_id)
        automan_config.update({'path': '/projects/' + project_id + '/originals/' + str(original_id) + '/', 'label_type': label_type})
        job_config = {
            'storage_type': storage['storage_type'],
            'storage_config': storage_config,
            'automan_config': automan_config
        }
        job_config_json = json.dumps(job_config)
        new_job = Job(
            job_type='analyzer',
            user_id=user_id,
            project_id=project_id,
            job_config=job_config_json)
        new_job.save()
        if original['file_type'] == 'rosbag':
            job = RosbagAnalyzer(**job_config)
            job.create(cls.__generate_job_name(new_job.id, 'analyzer'))
            res = job.run()
            return res
        else:
            raise ValidationError()

    @staticmethod
    def __get_automan_config(user_id):
        jwt = AccountManager.create_jwt(user_id)
        url = os.environ.get("AUTOMAN_URL")
        port = os.environ.get("AUTOMAN_PORT")
        host = 'http://' + url + ':' + port
        automan_config = {
            'host': host,
            'jwt': jwt,
        }
        return automan_config

    @staticmethod
    def __get_raw_data_config(project_id, original_id, candidates):
        records = {}
        for candidate_id in candidates:
            original_manager = OriginalManager()
            candidate = original_manager.get_dataset_candidate(candidate_id)
            analyzed_info = json.loads(candidate['analyzed_info'])
            records[analyzed_info['topic_name']] = candidate_id

        raw_data_config = {
            'project_id': int(project_id),
            'original_id': original_id,
            'candidates': candidates,
            'records': records,
        }
        return raw_data_config

    @classmethod
    def __is_unknown_time_limit(cls, unknown_started):
        if not unknown_started:
            return False
        time = datetime.now(timezone.utc) - unknown_started
        if time.seconds > UNKNOWN_LIMIT_TIME:
            return True
        return False

    @classmethod
    def __get_job_status(cls, id, job_type):
        namespace = cls.__generate_job_namespace()
        res = BaseJob().fetch(cls.__generate_job_name(id, job_type), namespace)
        if res['is_succeeded']:
            content = res['content']
            status = cls.__get_status_from_k8s_response(content)
            return status, content.start_time, content.completion_time
        else:
            return None, None, None

    @staticmethod
    def __get_status_from_k8s_response(content):
        if content.succeeded:
            return STATUS_MAP['succeeded']
        elif content.failed:
            return STATUS_MAP['failed']
        elif content.active:
            return STATUS_MAP['active']
        else:
            return STATUS_MAP['unknown']

    @staticmethod
    def __generate_job_name(id, job_type):
        return job_type + '-' + str(id)

    # FIXME: Consider security
    @staticmethod
    def __generate_job_namespace(key=None):
        return key is not None if key else 'default'
