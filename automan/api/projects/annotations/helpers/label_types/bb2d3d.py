from cerberus import Validator
from .bb2d import BB2D


class BB2D3D(object):
    SCHEMA = {
        'x_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'y_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'z_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'width_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'length_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'height_3d': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
        'yaw': {
            'type': 'float',
            'required': True,
            'empty': False,
        },
    }

    @staticmethod
    def validate(label):
        # TODO: instantiate only once
        v = Validator(BB2D3D.SCHEMA)
        is_valid = v.validate(label)
        if is_valid is False:
            v = Validator(BB2D.SCHEMA)
            is_valid = v.validate(label)
        return is_valid
