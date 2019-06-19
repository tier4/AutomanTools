from rest_framework import serializers
from .models import LabelDataset


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabelDataset
        fields = '__all__'
