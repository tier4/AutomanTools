from django.core.exceptions import ValidationError
from ..models import LabelDataset
from automan_website.settings import STORAGE_TYPE, STORAGE_CONFIG
from libs.storages.azure_blob_storage_client import AzureBlobStorageClient
from django.core.exceptions import ObjectDoesNotExist


class DatasetFrameManager():
    @classmethod
    def list_dataset_frames(cls, project_id, dataset_id):
        dataset = LabelDataset.objects.filter(
            id=dataset_id, project_id=project_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()

        content = {}
        records = []
        if STORAGE_TYPE == 'AZURE':
            blob_client = AzureBlobStorageClient(STORAGE_CONFIG)
            blobs = blob_client.list(STORAGE_CONFIG['container'], dataset.file_path + '/JPEGImages/')  # Only BB2D
            records = [blob.name for blob in blobs]
        else:
            raise ValidationError
            # raise NotImplementedError  # FIXME
        # TODO: dataset.frame_count == len(images)
        content = {'count': len(records), 'records': records}
        return content

    @classmethod
    def get_dataset_frame(cls, project_id, dataset_id, frame):
        dataset = LabelDataset.objects.filter(
            id=dataset_id, project_id=project_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()

        if STORAGE_TYPE == 'AZURE':
            # TODO: Support multi cameras (e.g. Ladybug)
            blob_client = AzureBlobStorageClient(STORAGE_CONFIG)
            blobs = blob_client.list(STORAGE_CONFIG['container'], dataset.file_path + '/JPEGImages/')  # Only BB2D
            blob = blobs[frame]
            url = STORAGE_CONFIG['base_uri'] + STORAGE_CONFIG['container'] + '/' + blob.name
        return {'imageURL': url}
