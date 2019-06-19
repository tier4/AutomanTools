from django.conf.urls import url
from projects import views

urlpatterns = [
    url(r'^(?P<project_id>\d+)/$', views.project_info, name='project_info'),
    url(r'^(?P<project_id>\d+)/groups/$', views.groups_index, name='groups_index'),
    url(r'^(?P<project_id>\d+)/groups/(?P<group_id>\d+)/$', views.group_info, name='group_info'),
    url(r'^(?P<project_id>\d+)/groups/(?P<group_id>\d+)/members/$', views.add_group_member, name='add_group_member'),
    url(r'^(?P<project_id>\d+)/groups/(?P<group_id>\d+)/members/(?P<user_id>\d+)/$',
        views.remove_group_member, name='remove_group_member'),
    url(r'^(?P<project_id>\d+)/groups/(?P<group_id>\d+)/$', views.group_info, name='group_info'),
    url(r'^(?P<project_id>\d+)/klassset/$', views.create_klassset, name='create_klassset'),
    url(r'^(?P<project_id>\d+)/users/$', views.users, name='project_users'),
    url(r'^$', views.index, name='index'),
]
