import json
from datetime import datetime
from django.db.models import Q
from django.core.exceptions import FieldError
from rest_framework import serializers
from .models import Storage
from api.settings import PER_PAGE, SORT_KEY, MOUNT_PATH, VOLUME_NAME, CLAIM_NAME
from api.common import validation_check


class StorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Storage
        # fields = '__all__'
        fields = ('storage_type', 'storage_config', 'project')

    def create(self, validated_data):
        # FIXME storage_type validation
        storage_config = validated_data.pop('storage_config')
        if validated_data.get('storage_type') == 'LOCAL_NFS':
            if MOUNT_PATH:
                storage_config = self.__local_storage_config(validated_data.get('project').id)
            else:
                raise Exception  # FIXME
        else:
            raise NotImplementedError  # FIXME

        new_storage = Storage(storage_config=storage_config, **validated_data)
        new_storage.save()
        return new_storage

    @classmethod
    def list(
            cls, project_id, sort_key=SORT_KEY, is_reverse=False,
            per_page=PER_PAGE, page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                storages = Storage.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(storage_type__contains=search_keyword) | Q(storage_config__contains=search_keyword)
                )[begin:begin + per_page]
            else:
                storages = Storage.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(storage_type__contains=search_keyword) | Q(storage_config__contains=search_keyword)
                )[begin:begin + per_page]
        except FieldError:
            storages = Storage.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(storage_type__contains=search_keyword) | Q(storage_config__contains=search_keyword)
            )[begin:begin + per_page]
        records = []
        for storage in storages:
            record = {}
            record['id'] = storage.id
            record['storage_type'] = storage.storage_type
            record['updated_at'] = str(storage.updated_at)
            record['storage_config'] = storage.storage_config
            records.append(record)
        contents = {}
        contents['count'] = cls.storage_total_count(project_id)
        contents['records'] = records
        return contents

    @classmethod
    def storage_total_count(cls, project_id):
        storages = Storage.objects.filter(project_id=project_id)
        return storages.count()

    def get_storage(self, project_id, storage_id):
        storage = Storage.objects.filter(id=storage_id, project_id=project_id).first()
        record = {
            'id': storage.id,
            'storage_type': storage.storage_type,
            'storage_config': json.loads(storage.storage_config),
        }
        return record

    def get_storages(self, project_id):
        storages = Storage.objects.filter(project_id=project_id)
        records = []
        for storage in storages:
            record = {
                'id': storage.id,
                'storage_type': storage.storage_type,
                'storage_config': json.loads(storage.storage_config),
            }
            print(record)
            records.append(record)
        return records

    @staticmethod
    def get_original_path(storage_type, storage_config, name):
        if storage_type == 'LOCAL_NFS':
            return storage_config['mount_path'] + storage_config['base_dir'] + '/' + name + '/raw/' + name
        else:
            raise NotImplementedError  # FIXME

    @staticmethod
    def get_dataset_output_dir(storage_type, storage_config, name, candidates):
        if storage_type == 'LOCAL_NFS':
            candidates_str = '_'.join(map(str, candidates))
            return (storage_config['mount_path'] + storage_config['base_dir']
                    + '/dataset_' + candidates_str + '_'
                    + datetime.now().strftime('%s') + '/')
        else:
            raise NotImplementedError  # FIXME

    def __local_storage_config(self, project_id):
        return json.dumps({
            'mount_path': MOUNT_PATH,
            'volume_name': VOLUME_NAME,
            'claim_name': CLAIM_NAME,
            'base_dir': '/' + str(project_id),
        })
