# -*- coding: utf-8 -*-

import os
from typing import Dict
import boto3
from boto3.session import Session
from botocore.exceptions import ClientError
import base64
import json


def _is_mysql_access_in_env() -> bool:
    return os.getenv('MYSQL_USER') is not None and os.getenv('MYSQL_PASSWORD') is not None


def _get_mysql_access_from_env() -> Dict[str, str]:
    return {
        'MYSQL_USER': os.getenv('MYSQL_USER'),
        'MYSQL_PASSWORD': os.getenv('MYSQL_PASSWORD')
    }


def _is_mysql_access_in_secret() -> bool:
    return os.getenv('MYSQL_SECRET_NAME') is not None


def _get_secret() -> str:
    secret_name = os.getenv('MYSQL_SECRET_NAME', None)
    region_name = os.getenv('REGION', 'ap-northeast-1')

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            raise e
    else:
        if 'SecretString' in get_secret_value_response:
            return get_secret_value_response['SecretString']
        else:
            return base64.b64decode(get_secret_value_response['SecretBinary'])


def get_mysql_username_password() -> Dict[str, str]:
    if _is_mysql_access_in_env():
        return _get_mysql_access_from_env()
    elif _is_mysql_access_in_secret():
        secret_json = _get_secret()
        secret = json.loads(secret_json)
        return {
            'MYSQL_USER': secret['username'],
            'MYSQL_PASSWORD': secret['password']
        }
    else:
        raise RuntimeError('MYSQL username and password must be set with secret manager or environment variables.')
