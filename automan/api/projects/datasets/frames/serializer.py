from rest_framework import serializers
from .models import DatasetFrame


class DatasetFrameSerializer(serializers.Serializer):
    class Meta:
        model = DatasetFrame
        fields = ['dataset', 'frame_number', 'secs', 'nsecs']
