import boto3
import os
import json


class AwsS3Client(object):
    def __init__(self):
        self.AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
        self.AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
        self.AWS_ARN = os.environ.get('AWS_ARN')
        self.AWS_REGION = os.environ.get('AWS_REGION')

    def __make_s3_session(self):
        sts = boto3.client(
            'sts',
            aws_access_key_id=self.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.AWS_SECRET_ACCESS_KEY,
            region_name=self.AWS_REGION)
        response = sts.assume_role(
            RoleArn=self.AWS_ARN,
            RoleSessionName="automan-presigned-url")
        session = boto3.Session(
            aws_access_key_id=response['Credentials']['AccessKeyId'],
            aws_secret_access_key=response['Credentials']['SecretAccessKey'],
            aws_session_token=response['Credentials']['SessionToken'],
            region_name=self.AWS_REGION)
        return session.client('s3')

    def get_s3_put_url(self, bucket, key):
        key = key.lstrip('/')

        s3 = self.__make_s3_session()
        url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={'Bucket': bucket,
                    'Key': key,
                    'ContentType': 'application/octet-stream'},
            ExpiresIn=1800,
            HttpMethod='PUT')
        return url

    def get_s3_post_url(self, bucket, key):
        key = key.lstrip('/')

        s3 = self.__make_s3_session()
        res = s3.generate_presigned_post(
            bucket,
            key,
            ExpiresIn=1800)
        return json.dumps(res)

    def get_s3_down_url(self, bucket, key):
        key = key.lstrip('/')

        s3 = self.__make_s3_session()
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket,
                    'Key': key},
            ExpiresIn=1800,
            HttpMethod='GET')
        return url
