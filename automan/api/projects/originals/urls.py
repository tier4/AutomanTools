from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^subfile/$', views.register_subfile, name='subfile'),
    url(r'^file_upload/$', views.file_upload, name='file_upload'),
    url(r'^(?P<original_id>\d+)/$', views.original_info, name='original_info'),
    url(r'^(?P<original_id>\d+)/candidates/$', views.candidate_info, name='candidate_info'),
    url(r'^(?P<original_id>\d+)/candidates/(?P<candidate_id>\d+)/$', views.set_candidate_info, name='set_candidate_info'),
]
