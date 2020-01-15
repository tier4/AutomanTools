import copy
import json
import shutil
import os
from datetime import datetime
from django.core.exceptions import ObjectDoesNotExist, FieldError, ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from projects.originals.models import Original, DatasetCandidate


class CandidateManager(object):
    def is_exist_original(self, original_id):
        original = Original.objects.filter(id=original_id).first()
        if original is None:
            return False
        return True

    def delete_candidate(self, original_id):
        candidates = DatasetCandidate.objects.filter(original=original_id)
        for candidate in candidates:
            candidate.delete()
