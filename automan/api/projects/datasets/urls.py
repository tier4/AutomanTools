from django.conf.urls import url
from . import views

urlpatterns = [
    url(
        r'^(?P<dataset_id>\d+)/candidates/(?P<candidate_id>\d+)/frames/(?P<frame>\d+)/$',
        views.get_frame, name='download_link'),
    url(
        r'^(?P<dataset_id>\d+)/candidates/(?P<candidate_id>\d+)/frames/(?P<frame>\d+)/image/$',
        views.download_local_nfs_image, name='download_local_nfs_image'),
    url(
        r'^(?P<dataset_id>\d+)/map_to_base_link/$',
        views.get_map_to_base_link, name='download_link'),
    url(
        r'^(?P<dataset_id>\d+)/map_to_base_link/download/$',
        views.download_local_map_to_base_link, name='download_local_nfs_file'),
]
