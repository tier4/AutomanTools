from django.conf.urls import url
from pages import views

urlpatterns = [
    url(r'^terms_of_service/$', views.terms_of_service, name='terms_of_service'),
    url(r'^application/mypage/$', views.application, name='mypage'),
    url(r'^application/(0|[1-9][0-9]*)/annotations/(0|[1-9][0-9]*)/labeling_tool',
        views.labeling_tool, name='labeling_tool'),
    url(r'^application/(0|[1-9][0-9]*)/', views.application, name='application'),
    url(r'^$', views.top, name='top'),
]
