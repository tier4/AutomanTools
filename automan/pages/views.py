# -*- coding: utf-8 -*-
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.http import require_GET
from utility.service_log import ServiceLog


@require_GET
def application(request, project_id=None):
    try:
        data = {}
        return render(request, 'application.html', data)
    except Exception:
        ServiceLog.error(traceback.format_exc())
        return HttpResponse(status=500)


@require_GET
def labeling_tool(request, project_id=None, annotation_id=None):
    try:
        data = {}
        return render(request, 'labeling_tool/labeling_tool.html', data)
    except Exception:
        ServiceLog.error(traceback.format_exc())
        return HttpResponse(status=500)


@require_GET
def top(request):
    try:
        data = {}
        return render(request, 'top.html', data)
    except Exception:
        ServiceLog.error(traceback.format_exc())
        return HttpResponse(status=500)


@require_GET
def terms_of_service(request):
    try:
        data = {}
        return render(request, 'terms_of_service.html', data)
    except Exception:
        ServiceLog.error(traceback.format_exc())
        return HttpResponse(status=500)
