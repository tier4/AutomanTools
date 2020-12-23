from cerberus import Validator


class MemoValidator(object):
    MEMO_LENGTH = 128

    @staticmethod
    def validate(memo):
        if type(memo) is not str:
            return False
        if len(memo) > MemoValidator.MEMO_LENGTH:
            return False
        return True
