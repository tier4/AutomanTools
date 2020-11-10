import json
from kubernetes import client
from libs.k8s.jobs import BaseJob
from projects.storages.aws_s3 import AwsS3Client
from automan_website import settings


class RosbagAnalyzer(BaseJob):
    IMAGE_NAME = settings.JOB['ANALYZER']['IMAGE_NAME']
    REPOSITORY_NAME = (settings.JOB_DOCKER_REGISTRY_HOST + '/' if settings.JOB_DOCKER_REGISTRY_HOST else "") + IMAGE_NAME + ':' + settings.JOB['ANALYZER']['IMAGE_TAG']
    MEMORY = settings.JOB['ANALYZER']['MEMORY']

    # TODO: automan_server_info
    def __init__(self, storage_type, storage_config, automan_config,
                 k8s_config_path=None, ros_distrib='kinetic'):
        super(RosbagAnalyzer, self).__init__(k8s_config_path)
        self.storage_type = storage_type
        if storage_type == 'LOCAL_NFS':
            self.mount_path = storage_config['mount_path']
            self.volume_name = storage_config['volume_name']
            self.claim_name = storage_config['claim_name']
            self.storage_info = json.dumps({'path': storage_config['path']}, separators=(',', ':'))
            self.automan_info = json.dumps(automan_config, separators=(',', ':'))
        elif storage_type == 'AWS_S3':
            self.storage_info = json.dumps(
                {'bucket': storage_config['bucket'],
                 'base_dir': storage_config['base_dir'],
                 'target_url': AwsS3Client().get_s3_down_url(storage_config['bucket'], storage_config['path'])},
                separators=(',', ':'))
            print(self.storage_info)
            self.automan_info = json.dumps(automan_config, separators=(',', ':'))
        else:
            raise NotImplementedError  # FIXME

    def create(self, name):
        self.job = client.models.V1Job(
            api_version='batch/v1', kind='Job',
            metadata=client.models.V1ObjectMeta(
                name=name,
            ),
            spec=client.models.V1JobSpec(
                # ttlSecondsAfterFinished = 1h
                ttl_seconds_after_finished=3600,
                active_deadline_seconds=600,
                completions=1,
                parallelism=1,
                # TODO: backoffLimit
                template=self.__get_pod()
            )
        )

    def __get_pod(self):
        if self.storage_type == 'LOCAL_NFS':
            return client.models.V1PodTemplateSpec(
                spec=client.models.V1PodSpec(
                    restart_policy='Never',
                    containers=self.__get_containers(),
                    volumes=self.__get_volumes()
                )
            )
        elif self.storage_type == 'AWS_S3':
            return client.models.V1PodTemplateSpec(
                spec=client.models.V1PodSpec(
                    restart_policy='Never',
                    containers=self.__get_containers()
                )
            )
        else:
            raise NotImplementedError

    def __get_containers(self):
        command = ["/app/bin/docker-entrypoint.bash"]
        args = ['pipenv', 'run', 'python', '/app/bin/rosbag_analyzer.py',
                '--storage_type', self.storage_type, '--storage_info',
                self.storage_info, '--automan_info', self.automan_info]
        system_usage = {'memory': self.MEMORY}
        containers = []
        if self.storage_type == 'LOCAL_NFS':
            containers = [
                client.models.V1Container(
                    command=command,
                    args=args,
                    image=self.REPOSITORY_NAME,
                    image_pull_policy='IfNotPresent',
                    name=self.IMAGE_NAME,
                    volume_mounts=[client.models.V1VolumeMount(mount_path=self.mount_path, name=self.volume_name)],
                    resources=client.models.V1ResourceRequirements(limits=system_usage, requests=system_usage),
                )
            ]
        elif self.storage_type == 'AWS_S3':
            containers = [
                client.models.V1Container(
                    command=command,
                    args=args,
                    image=self.REPOSITORY_NAME,
                    image_pull_policy='IfNotPresent',
                    name=self.IMAGE_NAME,
                    resources=client.models.V1ResourceRequirements(limits=system_usage, requests=system_usage),
                )
            ]
        else:
            raise NotImplementedError
        return containers

    def __get_volumes(self):
        volumes = [
            client.models.V1Volume(
                name=self.volume_name,
                persistent_volume_claim=client.models.V1PersistentVolumeClaimVolumeSource(claim_name=self.claim_name)
            ),
        ]
        return volumes
