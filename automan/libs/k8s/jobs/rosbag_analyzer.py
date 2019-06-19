import json
from kubernetes import client
from libs.k8s.jobs import BaseJob


class RosbagAnalyzer(BaseJob):
    IMAGE_NAME = 'automan-rosbag-analyzer'
    MEMORY = '128Mi'

    # TODO: automan_server_info
    def __init__(self, storage_type, storage_config, automan_config, k8s_config_path=None, ros_distrib='kinetic'):
        super(RosbagAnalyzer, self).__init__(k8s_config_path)
        self.storage_type = storage_type
        if storage_type == 'LOCAL_NFS':
            self.mount_path = storage_config['mount_path']
            self.volume_name = storage_config['volume_name']
            self.claim_name = storage_config['claim_name']
            self.storage_info = json.dumps({'path': storage_config['path']}, separators=(',', ':'))
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
                # ttlSecondsAfterFinished = 45 Day
                ttl_seconds_after_finished=3888000,
                active_deadline_seconds=600,
                completions=1,
                parallelism=1,
                # TODO: backoffLimit
                template=self.__get_pod()
            )
        )

    def __get_pod(self):
        pod_template_spec = client.models.V1PodTemplateSpec(
            spec=client.models.V1PodSpec(
                restart_policy='Never',
                containers=self.__get_containers(),
                volumes=self.__get_volumes()
            )
        )
        return pod_template_spec

    def __get_containers(self):
        command = ["/app/bin/docker-entrypoint.bash"]
        args = ['pipenv', 'run', 'python', '/app/bin/rosbag_analyzer.py',
                '--storage_type', self.storage_type, '--storage_info',
                self.storage_info, '--automan_info', self.automan_info]
        system_usage = {'memory': self.MEMORY}
        containers = [
            client.models.V1Container(
                command=command,
                args=args,
                image=self.IMAGE_NAME,
                image_pull_policy='IfNotPresent',
                name=self.IMAGE_NAME,
                # env=[access_key_env, secret_key_env],
                volume_mounts=[client.models.V1VolumeMount(mount_path=self.mount_path, name=self.volume_name)],
                resources=client.models.V1ResourceRequirements(limits=system_usage, requests=system_usage),
            )
        ]
        return containers

    def __get_volumes(self):
        volumes = [
            client.models.V1Volume(
                name=self.volume_name,
                persistent_volume_claim=client.models.V1PersistentVolumeClaimVolumeSource(claim_name=self.claim_name)
            ),
        ]
        return volumes
