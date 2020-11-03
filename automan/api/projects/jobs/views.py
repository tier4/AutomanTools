import json
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import HttpResponse
from rest_framework import viewsets
from .serializer import JobSerializer
from api.permissions import Permission
from api.settings import PER_PAGE, SORT_KEY
from accounts.account_manager import AccountManager


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    lookup_field = 'job_id'

    def create(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'create_job', project_id):
            raise PermissionDenied

        job_type = request.data['job_type']
        if job_type == 'ANALYZER':
            if not Permission.hasPermission(user_id, 'get_original', project_id):
                raise PermissionDenied
            job_config = request.data['job_config']
            original_id = int(job_config['original_id'])
            JobSerializer.analyze(user_id, project_id, original_id)
        elif job_type == 'EXTRACTOR':
            if not Permission.hasPermission(user_id, 'get_original', project_id):
                raise PermissionDenied
            if not Permission.hasPermission(user_id, 'create_dataset', project_id):
                raise PermissionDenied
            job_config = request.data['job_config']
            original_id = int(job_config['original_id'])
            candidates = job_config['candidates']
            JobSerializer.extract(user_id, project_id, original_id, candidates)
        elif job_type == 'ARCHIVER':
            if not Permission.hasPermission(user_id, 'get_original', project_id):
                raise PermissionDenied
            if not Permission.hasPermission(user_id, 'get_label', project_id):
                raise PermissionDenied
            job_config = request.data['job_config']
            original_id = int(job_config['original_id'])
            dataset_id = int(job_config['dataset_id'])
            annotation_id = int(job_config['annotation_id'])
            is_write_image = bool(job_config.get('write_image', True))  # TODO: delete default value
            JobSerializer.archive(user_id, int(project_id), dataset_id, original_id, annotation_id, is_write_image)
        else:
            raise ValidationError

        return HttpResponse(status=201, content=json.dumps({}), content_type='application/json')

    def list(self, request, project_id):
        username = request.user
        user_id = AccountManager.get_id_by_username(username)
        if not Permission.hasPermission(user_id, 'list_job', project_id):
            raise PermissionDenied
        per_page = int(request.GET.get(key="per_page", default=PER_PAGE))
        page = int(request.GET.get(key="page", default=1))
        sort_key = request.GET.get(key="sort_key", default=SORT_KEY)
        reverse_flag = request.GET.get(key="reverse_flag", default="false")
        is_reverse = (reverse_flag == "true")
        search_keyword = request.GET.get(key="search", default="")

        contents = JobSerializer.list_jobs(project_id, sort_key, is_reverse, per_page, page, search_keyword)
        return HttpResponse(content=json.dumps(contents), status=200, content_type='application/json')
