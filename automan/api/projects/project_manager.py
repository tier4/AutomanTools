import shutil
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist, FieldError
from projects.models import Projects
from projects.members.models import Members
from projects.storages.serializer import StorageSerializer
from projects.klassset.klassset_manager import KlasssetManager
from api.common import validation_check
from api.settings import SORT_KEY, PER_PAGE, SUPPORT_LABEL_TYPES
from api.permissions import Permission


class ProjectManager(object):

    def get_projects(self, user_id, sort_key=SORT_KEY, is_reverse=False, per_page=PER_PAGE, page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)

        project_ids = self.__user_projects(user_id)
        try:
            if is_reverse is False:
                projects = Projects.objects.order_by(sort_key).filter(
                    Q(id__in=project_ids),
                    Q(delete_flag=False),
                    Q(name__contains=search_keyword) | Q(description__contains=search_keyword))[begin:begin + per_page]
            else:
                projects = Projects.objects.order_by(sort_key).reverse().filter(
                    Q(id__in=project_ids),
                    Q(delete_flag=False),
                    Q(name__contains=search_keyword) | Q(description__contains=search_keyword))[begin:begin + per_page]
        except FieldError:
            projects = Projects.objects.order_by("id").filter(
                Q(id__in=project_ids),
                Q(delete_flag=False),
                Q(name__contains=search_keyword) | Q(description__contains=search_keyword))[begin:begin + per_page]

        records = []
        for project in projects:
            record = {}
            record['id'] = project.id
            record['name'] = project.name
            record['description'] = project.description
            record['label_type'] = project.label_type
            record['created_at'] = str(project.created_at)
            record['can_delete'] = Permission.hasPermission(user_id, 'delete_project', project.id)
            records.append(record)
            try:
                klassset_manager = KlasssetManager()
                klassset = klassset_manager.get_klassset(project.id)
                record['klassset_name'] = klassset.name
                record['klassset_id'] = klassset.id
            except Exception:
                record['klassset_name'] = ''
                record['klassset_id'] = 0
        contents = {}
        contents['count'] = self.project_total_count(user_id)
        contents['records'] = records
        contents['sort_key'] = sort_key
        contents['per_page'] = per_page
        contents['page'] = page
        return contents

    @classmethod
    def __user_projects(self, user_id):
        groups = Members.objects.filter(
            user_id=user_id, delete_flag=False)

        project_ids = []
        for group in groups:
            project_ids.append(group.project.id)
        return project_ids

    def project_total_count(self, user_id):
        project_ids = self.__user_projects(user_id)
        projects = Projects.objects.filter(
            id__in=project_ids, delete_flag=False)
        return projects.count()

    # (GET):/projects/:project_id:/
    def get_project(self, project_id, user_id):
        project = Projects.objects.filter(id=project_id, delete_flag=False).first()
        if project is None:
            raise ObjectDoesNotExist()

        contents = {}
        contents['id'] = project.id
        contents['name'] = project.name
        contents['description'] = project.description
        contents['label_type'] = project.label_type
        contents['created_at'] = str(project.created_at)
        klassset_manager = KlasssetManager()
        klassset_info = klassset_manager.get_klassset_info(project_id)
        contents['klassset'] = klassset_info
        return contents

    def get_project_id_by_name(self, name):
        project = Projects.objects.filter(name=name).first()
        if project is None:
            raise ObjectDoesNotExist()
        return project.id

    def delete_project(self, project_id, user_id):
        content = Projects.objects.filter(id=project_id).first()
        if content is None:
            raise ObjectDoesNotExist()
        storages = StorageSerializer().get_storages(project_id)
        for storage in storages:
            dir_path = (storage['storage_config']['mount_path']
                        + storage['storage_config']['base_dir'])
            shutil.rmtree(dir_path)
        content.delete()

    def __is_support_label_type(self, label_type):
        return label_type in SUPPORT_LABEL_TYPES
