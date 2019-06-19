# -*- coding: utf-8 -*-
from django.test import TestCase
from django.core.exceptions import ObjectDoesNotExist
from projects.datasets.dataset_manager import DatasetManager


USER_ID = 1
PROJECT_ID = 1


class TestProjectsManager(TestCase):
    """/labelss/dataset_manager.py"""
    fixtures = ['initial_data.json']

    def test_get_datasets(self):
        dataset_manager = DatasetManager()
        datasets = dataset_manager.get_datasets(PROJECT_ID, USER_ID)
        self.assertNotEqual(len(datasets), 0)

    def test_get_not_exist_datasets(self):
        dataset_manager = DatasetManager()
        result = dataset_manager.get_datasets(100, USER_ID)
        self.assertEqual(len(result['records']), 0)

    def test_delete_dataset(self):
        dataset_manager = DatasetManager()
        dataset_manager.delete_dataset(USER_ID, 1)

    def test_delete_not_exist_dataset(self):
        dataset_manager = DatasetManager()
        with self.assertRaises(ObjectDoesNotExist):
            dataset_manager.delete_dataset(USER_ID, 100)
