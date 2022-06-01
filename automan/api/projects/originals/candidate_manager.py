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

    def get_candidate(self, candidate_id):
        candidate = DatasetCandidate.objects.filter(id=candidate_id).first()
        content = {}
        if candidate is not None:
            content['id'] = candidate_id
            content['data_type'] = str(candidate.data_type)
            content['framme_count'] = candidate.frame_count
            content['analyzed_info'] = str(candidate.analyzed_info)
            content['calibration_info'] = str(candidate.calibration_info)
        return content
