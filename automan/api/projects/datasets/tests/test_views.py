from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_jwt import utils
from django.test import TransactionTestCase


class TestProjectsView(TransactionTestCase):
    """/labels/views.py"""
    fixtures = ['initial_data.json']

    def setUp(self):
        self.user = User.objects.get(username='test1')
        payload = utils.jwt_payload_handler(self.user)
        token = utils.jwt_encode_handler(payload)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + token)

    def test_get_datasets(self):
        response = self.client.get('/projects/1/datasets/')
        self.assertEqual(response.status_code, 200)

    def test_get_not_exist_datasets(self):
        response = self.client.get('/projects/2/datasets/')
        self.assertEqual(response.status_code, 200)

    def test_get_dataset(self):
        response = self.client.get('/projects/1/datasets/1/')
        self.assertEqual(response.status_code, 200)

    def test_get_not_exist_dataset(self):
        response = self.client.get('/projects/1/datasets/100/')
        self.assertEqual(response.status_code, 404)

    def test_delete_dataset(self):
        response = self.client.delete('/projects/1/datasets/50/')
        self.assertEqual(response.status_code, 204)

    def test_delete_not_exist_dataset(self):
        response = self.client.delete('/projects/1/datasets/100/')
        self.assertEqual(response.status_code, 404)
