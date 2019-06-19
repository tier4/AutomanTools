"""automan_website URL Configuration
"""
from django.urls import include, path
from django.conf.urls import url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.http import HttpResponse
from rest_framework_swagger.views import get_swagger_view
from rest_framework import routers
from projects.views import ProjectViewSet
from projects.calibrations.views import CalibrationViewSet
from projects.datasets.views import DatasetViewSet
from projects.datasets.frames.views import DatasetFrameViewSet
from projects.jobs.views import JobViewSet
from projects.groups.views import GroupViewSet
from projects.members.views import MemberViewSet
from projects.storages.views import StorageViewSet

API_TITLE = 'Automan API'
schema_view = get_swagger_view(title=API_TITLE)

urlpatterns = [
    url(r'^projects/(?P<project_id>\d+)/annotations/', include('projects.annotations.urls')),
    url(r'^projects/(?P<project_id>\d+)/originals/', include('projects.originals.urls')),
    url(r'^projects/(?P<project_id>\d+)/datasets/', include('projects.datasets.urls')),
    path('swagger-docs/', schema_view),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    url(r"health", lambda r: HttpResponse("OK")),
    url(r'^', include('pages.urls')),
]

router = routers.SimpleRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'projects/(?P<project_id>\d+)/groups', GroupViewSet, basename='group')
router.register(r'projects/(?P<project_id>\d+)/members', MemberViewSet, basename='member')
router.register(r'projects/(?P<project_id>\d+)/calibrations', CalibrationViewSet, basename='calibration')
router.register(r'projects/(?P<project_id>\d+)/datasets', DatasetViewSet, basename='dataset')
router.register(
    r'projects/(?P<project_id>\d+)/datasets/(?P<dataset_id>\d+)/frames',
    DatasetFrameViewSet, basename='dataset_frame'),
router.register(r'projects/(?P<project_id>\d+)/jobs', JobViewSet, basename='job')
router.register(r'projects/(?P<project_id>\d+)/storages', StorageViewSet, basename='storage')
urlpatterns += router.urls


urlpatterns += staticfiles_urlpatterns()
