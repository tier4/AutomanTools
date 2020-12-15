from django.core.exceptions import ValidationError
from ..models import LabelDataset
from projects.datasets.frames.models import DatasetFrame
from automan_website.settings import STORAGE_TYPE, STORAGE_CONFIG
from libs.storages.azure_blob_storage_client import AzureBlobStorageClient
from django.core.exceptions import ObjectDoesNotExist


class DatasetFrameManager:
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
    def get_dataset_frame(cls, project_id, dataset_id, frame, storage_type):
        dataset = LabelDataset.objects.filter(
            id=dataset_id, project_id=project_id).first()
        if dataset is None:
            raise ObjectDoesNotExist()

        if storage_type == 'AZURE':
            # TODO: Support multi cameras (e.g. Ladybug)
            blob_client = AzureBlobStorageClient(STORAGE_CONFIG)
            blobs = blob_client.list(STORAGE_CONFIG['container'], dataset.file_path + '/JPEGImages/')  # Only BB2D
            blob = blobs[frame]
            url = STORAGE_CONFIG['base_uri'] + STORAGE_CONFIG['container'] + '/' + blob.name
            frame = None
        elif storage_type == 'LOCAL_NFS' or storage_type == 'AWS_S3':
            frame = DatasetFrame.objects.filter(dataset_id=dataset_id, frame_number=frame).first()
            if frame is not None:
                frame = {
                    'id': frame.id,
                    'dataset_id': frame.dataset_id,
                    'frame_number': frame.frame_number,
                    'secs': frame.secs,
                    'nsecs': frame.nsecs,
                }
            url = None
        else:
            raise ValidationError('invalid storage_type: ' + storage_type)
        return {'imageURL': url, 'frame': frame}

    @classmethod
    def create_dataset_frame(cls, dataset_id, frames):
        frames = [
            DatasetFrame(
                dataset_id=dataset_id,
                frame_number=frame['frame_number'],
                secs=frame['secs'],
                nsecs=frame['nsecs'],
            ) for frame in frames
        ]
        return DatasetFrame.objects.bulk_create(frames)
