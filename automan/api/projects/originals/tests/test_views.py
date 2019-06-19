from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_jwt import utils
from django.test import TransactionTestCase
import json


class TestProjectsView(TransactionTestCase):
    """/projects/originals/views.py"""
    fixtures = ['initial_data.json']

    def setUp(self):
        self.user = User.objects.get(username='test1')
        payload = utils.jwt_payload_handler(self.user)
        token = utils.jwt_encode_handler(payload)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + token)

    def test_get_rosbags_info(self):
        response = self.client.get('/projects/1/originals/')
        self.assertEqual(response.status_code, 200)

    def test_get_rosbag_info(self):
        response = self.client.get('/projects/1/originals/1/')
        self.assertEqual(response.status_code, 200)

    def get_rosbag_count(self):
        response = self.client.get('/projects/1/originals/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        return content['count']

    def test_delete_rosbag_info(self):
        rosbag_count = self.get_rosbag_count()
        response = self.client.delete('/projects/1/originals/1/')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(rosbag_count - 1, self.get_rosbag_count())
