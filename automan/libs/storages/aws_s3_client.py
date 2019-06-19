# -*- coding: utf-8 -*-

import boto3
from boto3.session import Session


class AWSSTSGenerateError(Exception):
    pass


class AWSS3Client():
    DEFAULT_DURATION = 3600

    @staticmethod
    def generate_access_key(storage_config):
        try:
            import logging
            boto3.set_stream_logger(level=logging.DEBUG)
            session = Session(
                aws_access_key_id=storage_config['access_key_id'],
                aws_secret_access_key=storage_config['secret_access_key'],
                region_name=storage_config['region_name'])

            sts_client = session.client('sts')

            response = sts_client.assume_role(
                RoleArn=storage_config['sts']['role_arn'],
                RoleSessionName=storage_config['sts']['role_session_name'],
                Policy=storage_config['sts']['policy'],
                DurationSeconds=storage_config['sts'].get('duration', AWSS3Client.DEFAULT_DURATION))

            return response['Credentials']
        except Exception:
            raise AWSSTSGenerateError()


if __name__ == '__main__':
    import os
    storage_config = {
        'access_key_id': os.environ['AWS_ACCESS_KEY_ID'],
        'secret_access_key': os.environ['AWS_SECRET_ACCESS_KEY'],
        'region_name': os.environ['AWS_REGION_NAME'],
        'sts': {
            'role_arn': os.environ['AWS_STS_ROLE_ARN'],
            'role_session_name': os.environ['AWS_STS_ROLE_SESSION_NAME'],
            'policy': os.environ['AWS_STS_POLICY'],
        }
    }
    access_key = AWSS3Client.generate_access_key(storage_config)
    print(access_key)
