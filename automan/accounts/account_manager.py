from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from rest_framework_jwt.settings import api_settings


class AccountManager(object):
    @staticmethod
    def get_id_by_username(username):
        user = User.objects.filter(
            username=username).first()
        if user is None:
            raise ObjectDoesNotExist()
        return user.id

    @staticmethod
    def get_user_by_username(username):
        user = User.objects.filter(
            username=username).first()
        if user is None:
            raise PermissionDenied

        return {'username': user.username, 'email': user.email, 'is_superuser': user.is_superuser}

    @staticmethod
    def is_superuser(user_id):
        user = User.objects.filter(
            id=user_id).first()
        if user is None:
            raise PermissionDenied

        return user.is_superuser

    @staticmethod
    def create_jwt(user_id):
        user = User.objects.filter(id=user_id).first()
        if user is None:
            raise PermissionDenied

        jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
        jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER

        payload = jwt_payload_handler(user)
        token = jwt_encode_handler(payload)

        return token
