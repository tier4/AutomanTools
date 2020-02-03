import json
from django.db import transaction
from projects.models import KlassSet, KlassKlassSet


class KlasssetManager(object):
    def set_klassset(self, project_id, user_id, klasses):
        # TODO: One-to-one relation (proejct - klassset)
        with transaction.atomic():
            new_klassset = KlassSet(
                project_id=project_id,
                user_id=user_id,
            )
            new_klassset.save()
            for klass in klasses:
                config = {
                    "color": klass["color"],
                    "minSize": klass["minSize"]
                }
                new_klass_klassset = KlassKlassSet(
                    name=klass["name"],
                    klass_set_id=new_klassset.id,
                    config=json.dumps(config)
                )
                new_klass_klassset.save()
        return new_klassset.id

    def get_klassset(self, project_id):
        klassset = KlassSet.objects.filter(project_id=project_id).first()
        return klassset

    def get_klassset_info(self, project_id):
        klassset = KlassSet.objects.filter(
            project_id=project_id).first()
        try:
            klasses = KlassKlassSet.objects.filter(
                klass_set_id=klassset.id)
        except Exception:
            klasses = []

        records = []
        for klass in klasses:
            record = {}
            record['config'] = klass.config
            record['name'] = klass.name
            records.append(record)
        contents = {}
        contents['count'] = len(klasses)
        contents['records'] = records

        return contents
