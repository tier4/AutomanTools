import cv2
import numpy as np


def parse_calib(calib_path):
    fs = cv2.FileStorage(calib_path, cv2.FILE_STORAGE_READ)
    camera_extrinsic_mat = fs.getNode("CameraExtrinsicMat").mat().tolist()
    camera_mat = fs.getNode("CameraMat").mat().tolist()
    dist_coeff = np.transpose(fs.getNode("DistCoeff").mat()).tolist()
    return camera_extrinsic_mat, camera_mat, dist_coeff
