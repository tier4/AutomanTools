from cerberus import Validator


class BB2D(object):
    SCHEMA = {
        'truncated': {
            'type': 'float',
            'required': False,
            'empty': False,
        },
        'occluded': {
            'type': 'integer',
            'required': False,
            'empty': False,
        },
        'alpha': {
            'type': 'float',
            'required': False,
            'empty': False,
        },
        'min_x_2d': {
            'type': 'integer',
            'required': True,
            'empty': False,
        },
        'min_y_2d': {
            'type': 'integer',
            'required': True,
            'empty': False,
        },
        'max_x_2d': {
            'type': 'integer',
            'required': True,
            'empty': False,
        },
        'max_y_2d': {
            'type': 'integer',
            'required': True,
            'empty': False,
        }
    }

    @staticmethod
    def validate(label):
        # TODO: instantiate only once
        v = Validator(BB2D.SCHEMA)
        return v.validate(label)
