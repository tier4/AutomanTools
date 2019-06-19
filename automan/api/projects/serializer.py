from django.db import transaction
from rest_framework import serializers
from .models import Projects
from projects.groups.serializer import GroupSerializer
from projects.members.serializer import MemberSerializer


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        # fields = '__all__'
        fields = ('name', 'description', 'label_type', 'owner_id')

    @transaction.atomic
    def create(self, validated_data):
        project = Projects(**validated_data)
        project.save()

        # register admin group
        ga_serializer = GroupSerializer(data={'project': project.id, 'name': 'admin'})
        if not ga_serializer.is_valid():
            raise serializers.ValidationError(ga_serializer.errors)
        group = ga_serializer.save()

        # add owner to admin group
        m_serializer = MemberSerializer(data={
            'project': project.id,
            'user': project.owner_id,
            'group': group.id
        })
        if not m_serializer.is_valid():
            raise serializers.ValidationError(m_serializer.errors)
        m_serializer.save()

        # register default group
        ga_serializer = GroupSerializer(data={'project': project.id, 'name': 'default'})
        if not ga_serializer.is_valid():
            raise serializers.ValidationError(ga_serializer.errors)
        ga_serializer.save()
        return project
