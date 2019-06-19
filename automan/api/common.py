from django.core.exceptions import ValidationError
from api.settings import PER_PAGE_LIMIT


def validation_check(per_page, page):
    if per_page < 5 or PER_PAGE_LIMIT < per_page:
        raise ValidationError("per_page error")
    if page < 1:
        raise ValidationError("page error")
