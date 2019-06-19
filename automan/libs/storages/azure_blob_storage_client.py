# -*- coding: utf-8 -*-
import datetime
from azure.storage.blob.baseblobservice import BaseBlobService
from azure.storage.common import AccountPermissions
from azure.storage.blob import BlobPermissions


class AzureAccountSASGenerateError(Exception):
    pass


class AzureBlobStorageClient():

    def __init__(self, storage_config):
        self.service = BaseBlobService(
            account_name=storage_config['account_name'],
            account_key=storage_config['account_key'])

    def list(self, container, prefix):
        blobs = list(self.service.list_blobs(container, prefix=prefix))
        return blobs

    @staticmethod
    def generate_read_access_key(storage_config):
        permission = AccountPermissions.READ
        expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        return AzureBlobStorageClient.__generate_access_key(permission, expiry, storage_config)

    @staticmethod
    def generate_write_access_key(storage_config):
        permission = BlobPermissions(read=True, write=True, add=True, create=True)
        expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        return AzureBlobStorageClient.__generate_access_key(permission, expiry, storage_config)

    @staticmethod
    def __generate_access_key(permission, expiry, storage_config):
        try:
            base_blob_service = BaseBlobService(
                account_name=storage_config['account_name'],
                account_key=storage_config['account_key'])

            sas = base_blob_service.generate_blob_shared_access_signature(
                storage_config['container'],
                storage_config['blob'],
                permission,
                expiry)
            return {
                'sas': sas,
                'base_uri': storage_config['base_uri'],
                'container': storage_config['container']}
        except Exception:
            raise AzureAccountSASGenerateError()


if __name__ == '__main__':
    import os
    import argparse

    parser = argparse.ArgumentParser(description='Issue Azure Blob SAS')
    parser.add_argument('--container', help='Azure Container Name', required=True)
    parser.add_argument('--blob', help='Azure BLOB Name', required=True)

    args = parser.parse_args()
    storage_config = {
        'account_name': os.environ['AZURE_ACCOUNT_NAME'],
        'account_key': os.environ['AZURE_ACCOUNT_KEY'],
        'container': args.container,
        'blob': args.blob,
        'base_uri': 'https://' + os.environ.get('AZURE_ACCOUNT_NAME') + '.blob.core.windows.net/'
    }
    access_key = AzureBlobStorageClient.generate_read_access_key(storage_config)
    print(access_key)
