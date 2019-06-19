from django.conf.urls import url
from rest_framework_jwt.views import obtain_jwt_token

from . import views

app_name = 'accounts'

urlpatterns = [
    url(r'auth/', obtain_jwt_token),
    url(r'signup/', views.SignupView.as_view(), name='signup'),
    url(r'login/', views.Login.as_view(), name='login'),
    url(r'^me/$', views.account, name='me'),
]
