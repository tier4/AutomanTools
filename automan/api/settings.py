import os

# Database default settings
PER_PAGE = 10
PER_PAGE_LIMIT = 100
SORT_KEY = "id"
MOUNT_PATH = os.environ.get('MOUNT_PATH', None)
VOLUME_NAME = os.environ.get('VOLUME_NAME', None)
CLAIM_NAME = os.environ.get('CLAIM_NAME', None)
# projects/

# labels/
SUPPORT_LABEL_TYPES = ['BB2D', 'BB2D3D']  # TODO: BB3D, SS2D

# rosbags/
