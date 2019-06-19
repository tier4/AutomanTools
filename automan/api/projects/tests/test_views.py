# -*- coding: utf-8 -*-
import json
from django.test import TransactionTestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_jwt import utils


class TestProjectsView(TransactionTestCase):
    """/projects/views.py"""
    fixtures = ['initial_data.json']

    def setUp(self):
        self.user = User.objects.get(username='test1')
        payload = utils.jwt_payload_handler(self.user)
        token = utils.jwt_encode_handler(payload)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + token)

    def get_project_count(response):
        content = json.loads(response.content.decode('utf-8'))
        return content['count']

    def test_get_projects(self):
        response = self.client.get('/projects/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        self.assertEqual(content['count'], 2)

    def test_post_project(self):
        response = self.client.get('/projects/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        count = content['count']

        response = self.client.post('/projects/', {'name': 'test_name', 'description': 'test', 'label_type': 'B2D'})
        self.assertEqual(response.status_code, 201)

        response = self.client.get('/projects/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        self.assertEqual(content['count'], count + 1)

    def test_get_project(self):
        response = self.client.get('/projects/1/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        self.assertEqual(content['name'], 'test001_2dbb')
        self.assertEqual(content['description'], '2DBB')

    def test_delete_project(self):
        response = self.client.delete('/projects/1/')
        self.assertEqual(response.status_code, 204)
        response = self.client.get('/projects/1/')
        self.assertEqual(response.status_code, 404)

    def test_get_groups(self):
        response = self.client.get('/projects/1/groups/')
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content.decode('utf-8'))
        self.assertEqual(content['count'], 2)

    def test_add_group_member(self):
        response = self.client.post('/projects/1/members/', {'username': 'test3', 'group_id': 1})
        self.assertEqual(response.status_code, 200)
