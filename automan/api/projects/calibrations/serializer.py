from rest_framework import serializers
from django.db.models import Q
from django.core.exceptions import FieldError
from api.common import validation_check
from api.settings import SORT_KEY, PER_PAGE
from .models import Calibration


class CalibrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calibration
        fields = ('name', 'content', 'project')

    @classmethod
    def list(
            cls, project_id, user_id, sort_key=SORT_KEY, is_reverse=False,
            per_page=PER_PAGE, page=1, search_keyword=""):
        validation_check(per_page, page)
        begin = per_page * (page - 1)
        try:
            if is_reverse is False:
                calibrations = Calibration.objects.order_by(sort_key).filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword))[begin:begin + per_page]
            else:
                calibrations = Calibration.objects.order_by(sort_key).reverse().filter(
                    Q(project_id=project_id),
                    Q(name__contains=search_keyword))[begin:begin + per_page]
        except FieldError:
            calibrations = Calibration.objects.order_by("id").filter(
                Q(project_id=project_id),
                Q(name__contains=search_keyword))[begin:begin + per_page]
        records = []
        for calibration in calibrations:
            record = {}
            record['id'] = calibration.id
            record['created_at'] = str(calibration.created_at)
            record['name'] = calibration.name
            record['content'] = calibration.content
            records.append(record)
        contents = {}
        contents['count'] = cls.calibration_total_count(project_id)
        contents['records'] = records
        return contents

    @staticmethod
    def calibration_total_count(project_id):
        calibrations = Calibration.objects.filter(project_id=project_id)
        return calibrations.count()
