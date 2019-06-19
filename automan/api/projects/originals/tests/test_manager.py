from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_jwt import utils
from django.test import TestCase
from projects.originals.original_manager import OriginalManager

PROJECT_ID = 1
ROSBAG_ID = 1
USER_ID = 1


class TestProjectsView(TestCase):
    """/rosbags/rosbag_manager.py"""
    fixtures = ['initial_data.json']

    def setUp(self):
        self.user = User.objects.get(username='test1')
        payload = utils.jwt_payload_handler(self.user)
        token = utils.jwt_encode_handler(payload)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + token)

    def test_get_originals(self):
        original_manager = OriginalManager()
        rosbags = original_manager.get_originals(PROJECT_ID)
        self.assertEqual(len(rosbags), 2)
