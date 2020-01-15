from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist, FieldError
from api.common import validation_check
from api.settings import SORT_KEY, PER_PAGE
from .models import LabelDataset, DatasetDatasetCandidate
from projects.originals.candidate_manager import CandidateManager


class DatasetManager(object):

    def get_datasets(self, project_id, user_id, sort_key=SORT_KEY, is_reverse=False, per_page=PER_PAGE,
                     page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                datasets = LabelDataset.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(delete_flag=False),
                    Q(name__contains=search_keyword) | Q(name__contains=search_keyword))[begin:begin + per_page]
            else:
                datasets = LabelDataset.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(delete_flag=False),
                    Q(name__contains=search_keyword) | Q(name__contains=search_keyword))[begin:begin + per_page]
        except FieldError:
            datasets = LabelDataset.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(delete_flag=False),
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
        datasets = LabelDataset.objects.filter(
            project_id=project_id, delete_flag=False)
        return datasets.count()

    def create_dataset(self, name, file_path, frame_count, original_id, project_id, candidates):
        new_dataset = LabelDataset(
            name=name,
            file_path=file_path,
            frame_count=frame_count,
            original=original_id,
            project_id=project_id,
            delete_flag=False)
        new_dataset.save()

        for candidate in candidates:
            new_candidate = DatasetDatasetCandidate(
                dataset_id=new_dataset.id,
                dataset_candidate_id=candidate
            )
            new_candidate.save()
        return new_dataset.id

    def delete_dataset(self, admin_id, dataset_id):
        dataset = LabelDataset.objects.filter(id=dataset_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        # check original_id exist
        candidate_manager = CandidateManager()
        if not candidate_manager.is_exist_original(dataset.original):
            # delete candidate
            candidate_manager.delete_candidate(dataset.original)
        dataset.delete()

    def get_dataset(self, user_id, dataset_id):
        dataset = LabelDataset.objects.filter(id=dataset_id, delete_flag=False).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        contents = {}
        contents['id'] = dataset.id
        contents['name'] = dataset.name
        contents['file_path'] = dataset.file_path
        contents['original_id'] = dataset.original
        contents['frame_count'] = dataset.frame_count
        contents['created_at'] = str(dataset.created_at)
        contents['updated_at'] = str(dataset.updated_at)
        return contents

    def get_dataset_file_path(self, user_id, dataset_id):
        dataset = LabelDataset.objects.filter(id=dataset_id, delete_flag=False).first()
        if dataset is None:
            raise ObjectDoesNotExist()
        return dataset.file_path
