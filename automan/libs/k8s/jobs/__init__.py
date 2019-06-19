import os
import json
from kubernetes import client, config
from kubernetes.client.rest import ApiException


class BaseJob(object):
    def __init__(self, k8s_config_path=None):
        if not k8s_config_path:
            config_path = os.path.join(os.environ['HOME'], '.kube/config')
        try:
            config.load_kube_config(config_path)
        except Exception:
            config.load_incluster_config()  # in kubernetes
        self.batch_client = client.BatchV1Api()

    def create(self):
        raise NotImplementedError

    def run(self, namespace='default'):
        try:
            resp = self.batch_client.create_namespaced_job(
                namespace=namespace,
                body=self.job
            )
            return resp
        except Exception as e:
            print(e)
            raise Exception

    def list(self, namespace):
        pretty = 'pretty_example'
        limit = 56
        timeout_seconds = 56

        try:
            return self.batch_client.list_namespaced_job(
                namespace, pretty=pretty, limit=limit, timeout_seconds=timeout_seconds)
        except ApiException as e:
            print("Exception when calling BatchV1Api->list_namespaced_job: %s\n" % e)

    def fetch(self, name, namespace):
        pretty = 'pretty_example'

        try:
            res = self.batch_client.read_namespaced_job(name, namespace, pretty=pretty)
            return {'is_succeeded': True, 'content': res.status}
        except client.rest.ApiException as e:
            return {'is_succeeded': False, 'content': json.loads(e.body)}
        except Exception as e:
            # FIXME: add logging
            raise e

    def delete(self, name, namespace):
        body = client.V1DeleteOptions()

        try:
            return self.batch_client.delete_namespaced_job(name=name, body=body, namespace=namespace)
        except client.rest.ApiException as e:
            print("Exception when calling BatchV1Api->delete_namespaced_job: %s\n" % e)
