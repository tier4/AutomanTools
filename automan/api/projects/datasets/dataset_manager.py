import shutil
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist, FieldError
from api.common import validation_check
from api.settings import SORT_KEY, PER_PAGE
from .models import LabelDataset, DatasetDatasetCandidate
from projects.originals.candidate_manager import CandidateManager
from projects.annotations.annotation_manager import AnnotationManager
from projects.storages.aws_s3 import AwsS3Client


class DatasetManager(object):

    def get_datasets(self, project_id, user_id, sort_key=SORT_KEY, is_reverse=False, per_page=PER_PAGE,
                     page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                datasets = LabelDataset.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword) | Q(name__contains=search_keyword))[begin:begin + per_page]
            else:
                datasets = LabelDataset.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword) | Q(name__contains=search_keyword))[begin:begin + per_page]
        except FieldError:
            datasets = LabelDataset.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(name__contains=search_keyword) | Q(name__contains=search_keyword))[begin:begin + per_page]
        records = []
        for dataset in datasets:
            record = {}
            record['id'] = dataset.id
            record['created_at'] = str(dataset.created_at)
            record['updated_at'] = str(dataset.updated_at)
            record['file_path'] = dataset.file_path
            record['name'] = dataset.name
            record['frame_count'] = dataset.frame_count
            record['original_id'] = dataset.original
            records.append(record)
        contents = {}
        contents['count'] = self.dataset_total_count(project_id)
        contents['records'] = records
        return contents

    def get_datasets_count_by_original(self, original_id):
        datasets = LabelDataset.objects.filter(original=original_id)
        return datasets.count()

    def dataset_total_count(self, project_id):
        datasets = LabelDataset.objects.filter(project_id=project_id)
        return datasets.count()

    def create_dataset(self, name, file_path, frame_count, original_id, project_id, candidates, version):
        new_dataset = LabelDataset(
            name=name,
            file_path=file_path,
            frame_count=frame_count,
            version_major=version[0],
            version_minor=version[1],
            version_patch=version[2],
            original=original_id,
            project_id=project_id)
        new_dataset.save()

        for candidate in candidates:
            new_candidate = DatasetDatasetCandidate(
                dataset_id=new_dataset.id,
                dataset_candidate_id=candidate
            )
            new_candidate.save()
        return new_dataset.id

    @transaction.atomic
    def delete_dataset(self, admin_id, dataset_id, storage):
        dataset = LabelDataset.objects.filter(id=dataset_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        # check original_id exist
        candidate_manager = CandidateManager()
        if not candidate_manager.is_exist_original(dataset.original):
            # delete candidate
            candidate_manager.delete_candidate(dataset.original)
        # delete dataset files (image, pcd)
        if storage['storage_type'] == 'LOCAL_NFS':
            shutil.rmtree(dataset.file_path)
        elif storage['storage_type'] == 'AWS_S3':
            AwsS3Client().delete_s3_files(
                storage['storage_config']['bucket'], dataset.file_path)
        AnnotationManager().delete_annotations(dataset_id, storage)
        dataset.delete()

    def get_dataset(self, user_id, dataset_id):
        candidate_manager = CandidateManager()
        dataset = LabelDataset.objects.filter(id=dataset_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        candidates = DatasetDatasetCandidate.objects.filter(dataset=dataset_id)
        contents = {}
        contents['id'] = dataset.id
        contents['name'] = dataset.name
        contents['file_path'] = dataset.file_path
        contents['original_id'] = dataset.original
        contents['frame_count'] = dataset.frame_count
        contents['created_at'] = str(dataset.created_at)
        contents['updated_at'] = str(dataset.updated_at)
        contents['candidates'] = []
        contents['extractor_version'] = [
            dataset.version_major,
            dataset.version_minor,
            dataset.version_patch
        ]
        for candidate in candidates:
            contents['candidates'].append(candidate_manager.get_candidate(candidate.dataset_candidate_id))
        print(contents)
        return contents

    def get_dataset_file_path(self, user_id, dataset_id):
        dataset = LabelDataset.objects.filter(id=dataset_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        return dataset.file_path
