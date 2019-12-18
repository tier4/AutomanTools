from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.annotations, name='annotations'),
    url(r'^(?P<annotation_id>\d+)/$', views.annotation, name='annotation'),
    url(r'^(?P<annotation_id>\d+)/archive/$', views.download_archived_annotation, name='download_archived_annotation'),
    url(r'^(?P<annotation_id>\d+)/frames/(?P<frame>\d+)/objects/$', views.frame, name='frame'),
    url(r'^(?P<annotation_id>\d+)/unlock/$', views.unlock, name='unlock'),
    url(r'^(?P<annotation_id>\d+)/instances/$', views.instances, name='instances'),
    url(r'^(?P<annotation_id>\d+)/instances/(?P<instance_id>\S+)/$', views.instance, name='instance'),
]
