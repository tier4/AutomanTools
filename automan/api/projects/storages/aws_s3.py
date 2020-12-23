import boto3
from botocore.client import Config
from botocore.errorfactory import ClientError
import os
import json


class AwsS3Client(object):
    def __init__(self):
        if os.path.isfile(os.environ.get('AWS_WEB_IDENTITY_TOKEN_FILE')):
            with open(os.environ.get('AWS_WEB_IDENTITY_TOKEN_FILE')) as f:
                token = f.read()
            session = boto3.session.Session()
            client = session.client('sts')
            response = client.assume_role_with_web_identity(
                RoleArn=os.environ.get('AWS_ROLE_ARN'),
                RoleSessionName='automan-assume-role',
                WebIdentityToken=token,
                DurationSeconds=900
            )
            self.session = boto3.Session(
                aws_access_key_id=response['Credentials']['AccessKeyId'],
                aws_secret_access_key=response['Credentials']['SecretAccessKey'],
                aws_session_token=response['Credentials']['SessionToken'],
                region_name='ap-northeast-1')
        elif os.path.isfile(os.environ.get('HOME') + '/.aws/config'):
            self.session = boto3.session.Session()

        self.s3 = self.session.client('s3', config=Config(signature_version='s3v4'))

    def get_s3_put_url(self, bucket, key):
        key = key.lstrip('/')

        url = self.s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={'Bucket': bucket,
                    'Key': key,
                    'ContentType': 'application/octet-stream'},
            ExpiresIn=1800,
            HttpMethod='PUT')
        return {'url': url}

    def get_s3_down_url(self, bucket, key):
        key = key.lstrip('/')

        url = self.s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket,
                    'Key': key},
            ExpiresIn=1800,
            HttpMethod='GET')
        return url

    def check_s3_key_exists(self, bucket, key):
        try:
            self.s3.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError:
            return False

    def delete_s3_files(self, bucket, key):
        # key = key.lstrip('/')

        # if key.endswith('/') is False:
        #     self.s3.delete_object(Bucket=bucket, Key=key)
        #     return

        # res = self.s3.list_objects_v2(Bucket=bucket, Prefix=key)
        # contents = res['Contents']
        # for content in contents:
        #     self.s3.delete_object(Bucket=bucket, Key=content['Key'])
        return
