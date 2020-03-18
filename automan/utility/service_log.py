#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import time
import traceback

from logging import getLogger, DEBUG, StreamHandler

logger = getLogger(__name__)
handler = StreamHandler()
handler.setLevel(DEBUG)
logger.setLevel(DEBUG)
logger.addHandler(handler)
logger.propagate = False


class ServiceLog:
    @classmethod
    def info(cls, msg, detail_msg="", exception=None, request=None):
        log_dict = ServiceLog.generate_log_dict(msg, "INFO", detail_msg, exception, request)
        logger.info(json.dumps(log_dict))

    @classmethod
    def debug(cls, msg, detail_msg="", exception=None, request=None):
        log_dict = ServiceLog.generate_log_dict(msg, "DEBUG", detail_msg, exception, request)
        logger.debug(json.dumps(log_dict))

    @classmethod
    def warning(cls, msg, detail_msg="", exception=None, request=None):
        log_dict = ServiceLog.generate_log_dict(msg, "WARNING", detail_msg, exception, request)
        logger.warning(json.dumps(log_dict))

    @classmethod
    def error(cls, msg, detail_msg="", exception=None, request=None):
        log_dict = ServiceLog.generate_log_dict(msg, "ERROR", detail_msg, exception, request)
        logger.error(json.dumps(log_dict))

    @classmethod
    def generate_log_dict(cls, msg, level, detail_msg="", exception=None, request=None):
        log_dict = {
            "timestamp": int(time.time()),
            "message": msg,
            "level": level,
            "detail_msg": detail_msg,
        }
        if exception:
            cause_frame = traceback.extract_tb(exception.__traceback__)[-1]
            traceback_msg = traceback.format_tb(exception.__traceback__)
            log_dict.update({
                "pathname": cause_frame.filename,
                "line": cause_frame.lineno,
                "funcname": cause_frame.name,
                "traceback": traceback_msg,
            })
        if request:
            log_dict.update({
                "request_path": request.path,
                "request_method": request.method,
            })
        return log_dict


def request_logger(func):
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        request = args[0]
        body = {}
        if request.method == 'POST':
            body = dict(request.POST)
        elif request.method == 'GET':
            body = dict(request.GET)

        exclusion_keys = ["mail", "password"]
        for key in exclusion_keys:
            body.pop(key, None)
        ServiceLog.info("request body", detail_msg=json.dumps(body), request=request)
        ret = func(*args, **kwargs)
        return ret
    return wrapper


if __name__ == '__main__':
    ServiceLog.info("info_msg")
    ServiceLog.debug("debug_msg")
    ServiceLog.warning("waring_msg")
    ServiceLog.error("error_msg")
