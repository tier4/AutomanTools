import traceback
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from api.projects.members.serializer import MemberSerializer
from accounts.account_manager import AccountManager
from utility.service_log import ServiceLog

# ACTIONS = ['create', 'modify', 'list', 'get', 'delete']
# RESOURCES = ['project', 'group', 'original', 'dataset', 'annotationwork',\
#              'label', 'klassset', 'member', 'job', 'storage', 'calibration']

DEFAULT_PERMISSIONS = [
    'create_original', 'modify_original', 'list_original', 'get_original',
    'create_calibration', 'list_calibration', 'get_calibration',
    'create_dataset', 'list_dataset', 'get_dataset', 'delete_dataset',
    'create_annotationwork', 'list_annotationwork', 'get_annotationwork', 'delete_annotationwork',
    'create_job', 'list_job', 'get_job',
    'create_label', 'list_label', 'get_label',
    'list_storage',
    'get_project']
ADMIN_PERMISSIONS = DEFAULT_PERMISSIONS + [
    'create_group', 'modify_group', 'list_group', 'get_group', 'delete_group',
    'create_klassset', 'modify_klassset', 'list_klassset', 'get_klassset',
    'create_storage', 'modify_storage', 'get_storage',
    'delete_project',
    'list_member', 'create_member', 'delete_member']
SUPER_ADMIN_PERMISSIONS = ADMIN_PERMISSIONS + []


class Permission():

    @staticmethod
    def hasPermission(user_id, permission, project_id=None):
        try:
            if AccountManager.is_superuser(user_id):
                return permission in SUPER_ADMIN_PERMISSIONS
            if project_id:
                group_name = MemberSerializer.get_group(project_id, user_id)

                if group_name == 'admin':
                    return permission in ADMIN_PERMISSIONS
                elif group_name == 'default':
                    return permission in DEFAULT_PERMISSIONS
            raise PermissionDenied

        except ObjectDoesNotExist:
            raise PermissionDenied
        except PermissionDenied:
            raise PermissionDenied
        except Exception:
            ServiceLog.error(traceback.format_exc())
            raise

    @staticmethod
    def getPermissions(user_id, project_id=None):
        try:
            if AccountManager.is_superuser(user_id):
                return SUPER_ADMIN_PERMISSIONS
            if project_id:
                group_name = MemberSerializer.get_group(project_id, user_id)

                if group_name == 'admin':
                    return ADMIN_PERMISSIONS
                elif group_name == 'default':
                    return DEFAULT_PERMISSIONS
            raise PermissionDenied

        except ObjectDoesNotExist:
            raise PermissionDenied
        except PermissionDenied:
            raise PermissionDenied
        except Exception:
            ServiceLog.error(traceback.format_exc())
            raise
