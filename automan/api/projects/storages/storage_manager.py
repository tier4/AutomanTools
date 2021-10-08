import os
from datetime import datetime
from .serializer import StorageSerializer
from projects.storages.aws_s3 import AwsS3Client
from api.errors import UnknownStorageTypeError

class StorageManager(object):

    def __init__(self, project_id, storage_id):
        self.storage = StorageSerializer().get_storage(project_id, storage_id)
        if self.storage['storage_type'] == 'LOCAL_NFS':
            self.original_dirname = (self.storage['storage_config']['mount_path']
                    + self.storage['storage_config']['base_dir'] + '/bags')

    def get_original_filepath(self, filename):
        if self.storage['storage_type'] == 'LOCAL_NFS':
            return self.original_dirname + '/' + filename
        elif self.storage['storage_type'] == 'AWS_S3':
            return filename

    def get_dataset_dirname(self, filename=None, candidates=None):
        if filename and candidates:
            candidates_str = '_'.join(map(str, candidates))
            if self.storage['storage_type'] == 'LOCAL_NFS':
                return (self.storage['storage_config']['mount_path']
                        + self.storage['storage_config']['base_dir']
                        + '/dataset_' + candidates_str + '_'
                        + datetime.now().strftime('%s') + '/')
            elif self.storage['storage_type'] == 'AWS_S3':
                return (self.storage['storage_config']['base_dir']
                        + '/datasets/dataset_' + candidates_str + '_'
                        + datetime.now().strftime('%s') + '/')

        raise UnknownStorageTypeError

    def original_file_exists(self, filename):
        if self.storage['storage_type'] == 'LOCAL_NFS':
            filepath = self.get_original_filepath(filename)
            return os.path.exists(filepath)
        elif self.storage['storage_type'] == 'AWS_S3':
            return AwsS3Client().check_s3_key_exists(self.storage['storage_config']['bucket'], filename)
        else:
            raise NotImplementedError  # FIXME

    # この関数nameなんてどこにも定義されてない
    def get_url(self):
        if self.storage['storage_type'] == 'AWS_S3':
            config = self.storage['storage_config']
            key = (config['base_dir'] + '/' + 'raws' + '/' + name)
            return AwsS3Client().get_s3_put_url(config['bucket'], key)

        raise UnknownStorageTypeError

    def get_s3_presigned_url(self, bucket, key):
        return AwsS3Client().get_s3_put_url(bucket, key)

    def get_sts(self):
        return AwsS3Client().get_sts()
