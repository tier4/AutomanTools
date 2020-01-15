import json
import uuid
from uuid import UUID
from datetime import datetime, timedelta, timezone
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import (
    ValidationError, ObjectDoesNotExist, PermissionDenied, FieldError)
from projects.annotations.models import DatasetObject, DatasetObjectAnnotation, AnnotationProgress
from projects.annotations.helpers.label_types.bb2d import BB2D
from projects.annotations.helpers.label_types.bb2d3d import BB2D3D
from .models import Annotation, ArchivedLabelDataset, FrameLock
from projects.models import Projects
from api.settings import PER_PAGE, SORT_KEY
from api.common import validation_check
from api.errors import UnknownLabelTypeError


class AnnotationManager(object):

    def create_annotation(self, user_id, project_id, name, dataset_id):
        new_annotation = Annotation(name=name, dataset_id=dataset_id, project_id=project_id)
        new_annotation.save()

        # FIXME: state
        new_progress = AnnotationProgress(
            annotation_id=new_annotation.id,
            user=user_id,
            state='created')
        new_progress.save()
        return new_annotation.id

    def get_annotation(self, annotation_id):
        annotation = Annotation.objects.filter(id=annotation_id).first()

        if annotation is None:
            raise ObjectDoesNotExist()
        contents = {}
        contents['id'] = annotation.id
        contents['name'] = annotation.name
        contents['created_at'] = str(annotation.created_at)
        contents['dataset_id'] = annotation.dataset_id
        return contents

    def annotation_total_count(self, project_id):
        annotations = Annotation.objects.filter(project_id=project_id)
        return annotations.count()

    def list_annotations(
            self, project_id, sort_key=SORT_KEY, is_reverse=False,
            per_page=PER_PAGE, page=1, search_keyword=""):
        annotations = Annotation.objects.filter(project=project_id)
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                annotations = Annotation.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword))[begin:begin + per_page]
            else:
                annotations = Annotation.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword))[begin:begin + per_page]
        except FieldError:
            annotations = Annotation.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(name__contains=search_keyword))[begin:begin + per_page]

        records = []
        for annotation in annotations:
            record = {}
            record['id'] = annotation.id
            record['name'] = annotation.name
            record['created_at'] = str(annotation.created_at)
            record['dataset_id'] = annotation.dataset_id
            record['archive_url'], record['file_name'] = self.get_archive_url(project_id, annotation.id)
            records.append(record)
        contents = {}
        contents['count'] = self.annotation_total_count(project_id)
        contents['records'] = records
        return contents

    def get_labels(self, user_id, annotation_id):
        annotation = Annotation.objects.filter(id=annotation_id).first()
        if annotation is None:
            raise ObjectDoesNotExist()

        # records = []
        # newest_annotation = \
        #     self.get_newest_annotation(annotation.id)
        # TODO: Implement

    def get_newest_annotation(self, annotation_id):
        newest_annotation = AnnotationProgress.objects.filter(
            annotation_id=annotation_id).order_by('-updated_at').first()
        if newest_annotation is None:
            raise ObjectDoesNotExist()
        return newest_annotation

    def delete_annotation(self, annotation_id):
        annotation = Annotation.objects.filter(id=annotation_id).first()
        annotation.delete()

    def get_frame_labels(self, project_id, user_id, try_lock, annotation_id, frame):
        objects = DatasetObject.objects.filter(
            annotation_id=annotation_id, frame=frame)
        if objects is None:
            raise ObjectDoesNotExist()
        if try_lock:
            self.release_lock(user_id, annotation_id)

        records = []
        count = 0
        for object in objects:
            label = DatasetObjectAnnotation.objects.filter(
                object_id=object.id).order_by('-created_at').first()
            if label.delete_flag is True:
                continue
            record = {}
            record['object_id'] = object.id
            record['name'] = label.name
            record['content'] = json.loads(label.content)
            record['instance_id'] = str(object.instance) if object.instance != None else None
            records.append(record)
            count += 1
        labels = {}
        labels['count'] = count
        labels['records'] = records
        labels['is_locked'], labels['expires_at'] = self.get_lock(
            try_lock, user_id, annotation_id, frame)
        return labels

    @transaction.atomic
    def set_frame_label(
            self, user_id, project_id, annotation_id, frame, created_list, edited_list, deleted_list):
        project = Projects.objects.filter(id=project_id).first()
        LabelClass = None
        if project.label_type == 'BB2D':
            LabelClass = BB2D
        elif project.label_type == 'BB2D3D':
            LabelClass = BB2D3D
        else:
            raise UnknownLabelTypeError  # TODO: BB3D

        if not self.has_valid_lock(user_id, annotation_id, frame):
            raise PermissionDenied

        # TODO: bulk insert (try to use bulk_create method)
        for label in created_list:
            for v in label['content'].values():
                if not LabelClass.validate(v):
                    raise ValidationError("Label content is invalid.")
            new_object = DatasetObject(
                annotation_id=annotation_id,
                frame=frame,
                instance=self.get_instance_id(label))
            new_object.save()
            new_label = DatasetObjectAnnotation(
                object_id=new_object.id,
                name=label['name'],
                content=json.dumps(label['content']))
            new_label.save()

        for label in edited_list:
            for v in label['content'].values():
                if not LabelClass.validate(v):
                    raise ValidationError("Label content is invalid.")
            edited_label = DatasetObjectAnnotation(
                object_id=label['object_id'],
                name=label['name'],
                content=json.dumps(label['content']))
            edited_label.save()
            self.update_instance_id(label)

        for object_id in deleted_list:
            dataset_object = DatasetObject.objects.filter(id=object_id).first()
            if dataset_object.annotation_id != int(annotation_id):
                raise ValidationError("Label content is invalid.")
            deleted_label = DatasetObjectAnnotation(
                object_id=object_id,
                name='',
                content='{}',
                delete_flag=True)
            deleted_label.save()

        # FIXME: state, progress
        new_progress = AnnotationProgress(
            annotation_id=annotation_id,
            user=user_id,
            state='editing',
            progress=0,
            frame_progress=frame)
        new_progress.save()

    def get_instance_id(self, label):
        use_instance = label.get('use_instance')
        if not use_instance:
            return None
        instance_id = label.get('instance_id', str(uuid.uuid4()))
        return instance_id

    def update_instance_id(self, label):
        dataset_object = DatasetObject.objects.filter(id=label['object_id']).first()
        instance_id = self.get_instance_id(label)
        if dataset_object.instance != instance_id:
            dataset_object.instance = self.get_instance_id(label)
            dataset_object.save()

    def set_archive(self, annotation_id, file_path, file_name):
        new_archive = ArchivedLabelDataset(
            annotation_id=annotation_id,
            file_path=file_path,
            file_name=file_name)
        new_archive.save()

    def get_archive_url(self, project_id, annotation_id):
        archive = ArchivedLabelDataset.objects.filter(
            annotation_id=annotation_id).order_by('-date').first()
        if archive is None:
            return '', ''
        archive_url = '/projects/' + str(project_id) + '/annotations/' + str(annotation_id) + '/archive/'
        return archive_url, archive.file_name

    def get_archive_path(self, annotation_id):
        archive = ArchivedLabelDataset.objects.filter(
            annotation_id=annotation_id).order_by('-date').first()
        archive_path = archive.file_path + '/' + archive.file_name
        return archive_path

    def get_instances(self, annotation_id):
            objects = DatasetObject.objects.filter(annotation_id=annotation_id)
            records = []
            for object in objects:
                records.append(str(object.instance))
            labels = {}
            labels['records'] = list(set(records))
            labels['count'] = len(labels['records'])
            return labels

    def get_instance(self, annotation_id, instance_id):
        if self.is_valid_uuid4(instance_id) is not True:
            raise ValidationError("instance_id is invalid")

        objects = DatasetObject.objects.filter(
            annotation_id=annotation_id, instance=instance_id)

        records = []
        for object in objects:
            label = DatasetObjectAnnotation.objects.filter(
                object_id=object.id).order_by('-created_at').first()
            if label.delete_flag is True:
                continue
            record = {}
            record['object_id'] = object.id
            record['name'] = label.name
            record['content'] = json.loads(label.content)
            record['frame'] = object.frame
            records.append(record)
        labels = {}
        labels['count'] = len(records)
        labels['instance_id'] = instance_id
        labels['records'] = records
        return labels

    def is_valid_uuid4(self, uuid4):
        try:
            UUID(uuid4, version=4)
            return True
        except:
            return False

    def get_lock(self, try_lock, user_id, annotation_id, frame):
        if try_lock is not True:
            return False, None
        lock = FrameLock.objects.filter(
            annotation_id=annotation_id, frame=frame
        ).first()
        new_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        if lock is None:
            lock = FrameLock(
                user=user_id,
                annotation_id=annotation_id,
                frame=frame,
                expires_at=new_expires_at)
            lock.save()
        elif lock.expires_at < datetime.now(timezone.utc):
            lock.user = user_id
            lock.expires_at = new_expires_at
            lock.save()
        else:
            return False, None
        return True, int(new_expires_at.timestamp())

    def release_lock(self, user_id, annotation_id):
        lock = FrameLock.objects.filter(
            user=user_id,
            annotation_id=annotation_id
        ).first()
        if lock is None:
            return False
        lock.delete()
        return True

    def has_valid_lock(self, user_id, annotation_id, frame):
        lock = FrameLock.objects.filter(
            user=user_id,
            annotation_id=annotation_id,
            frame=frame
        ).first()
        if lock is None:
            return False
        lock.expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        lock.save()
        return True
