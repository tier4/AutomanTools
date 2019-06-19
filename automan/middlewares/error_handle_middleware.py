import traceback
from django.http import HttpResponse
from django.core.exceptions import ValidationError, ObjectDoesNotExist, PermissionDenied
from utility.service_log import ServiceLog


class ErrorHandleMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        message = exception.message if hasattr(exception, 'message') else ''
        if isinstance(exception, ValidationError):
            ServiceLog.warning(message, exception=exception, request=request)
            return HttpResponse(status=400)
        elif isinstance(exception, PermissionDenied):
            ServiceLog.warning(message, exception=exception, request=request)
            return HttpResponse(status=403)
        elif isinstance(exception, ObjectDoesNotExist):
            ServiceLog.warning(message, exception=exception, request=request)
            return HttpResponse(status=404)

        ServiceLog.error(message, exception=exception, request=request)
        return HttpResponse(status=500)
