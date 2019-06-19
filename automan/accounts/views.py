import json
from django.contrib.auth import login
from django.views.generic import CreateView
from django.http import HttpResponse
from rest_framework.decorators import api_view
from django.contrib.auth.views import LoginView
from accounts.account_manager import AccountManager

from .forms import SignupForm


class SignupView(CreateView):
    form_class = SignupForm
    success_url = '/accounts/login/'
    template_name = 'registration/signup.html'

    def form_valid(self, form):
        valid = super().form_valid(form)
        login(self.request, self.object)
        return valid


class Login(LoginView):
    template_name = 'login.html'


@api_view(['GET'])
def account(request):
    username = request.user
    user = AccountManager.get_user_by_username(username)
    return HttpResponse(content=json.dumps(user),
                        status=200,
                        content_type='application/json')
