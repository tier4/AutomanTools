# -*- coding: utf-8 -*-
from django.test import TransactionTestCase
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from projects.project_manager import ProjectManager
from projects.klassset.klassset_manager import KlasssetManager

user_id = 1


class TestProjectsManager(TransactionTestCase):
    """/projects/project_manager.py"""
    fixtures = ['initial_data.json']

    def test_get_projects(self):
        project_manager = ProjectManager()
        result = project_manager.get_projects(user_id)
        self.assertEqual(len(result['records']), 2)

    def test_get_project(self):
        project_manager = ProjectManager()
        project = project_manager.get_project(1, user_id)
        self.assertIsNotNone(project)

    def test_get_not_exist_project(self):
        project_manager = ProjectManager()
        with self.assertRaises(ObjectDoesNotExist):
            project_manager.get_project(100, user_id)

    def test_delete_project(self):
        project_manager = ProjectManager()
        result = project_manager.get_projects(user_id)
        count = len(result['records'])

        project_manager.delete_project(1, user_id)
        result = project_manager.get_projects(user_id)
        self.assertEqual(len(result['records']), count - 1)

    def test_delete_not_exist_project(self):
        project_manager = ProjectManager()
        with self.assertRaises(ObjectDoesNotExist):
            project_manager.delete_project(100, user_id)

    def test_set_klassset(self):
        klassset_manager = KlasssetManager()
        klasses = []
        klass = {}
        klass['color'] = "red"
        klass['minSize'] = "test_min"
        klass['id'] = 1
        klass['name'] = "test_klass"
        klasses.append(klass)

        klassset_id = klassset_manager.set_klassset(2, 1, klasses)
        self.assertIsNotNone(klassset_id)

    def test_get_klassset(self):
        klassset_manager = KlasssetManager()
        klassset = klassset_manager.get_klassset(1)
        self.assertIsNotNone(klassset)

    def test_get_klassset_info(self):
        klassset_manager = KlasssetManager()
        klassset = klassset_manager.get_klassset_info(1)
        self.assertIsNotNone(klassset)
