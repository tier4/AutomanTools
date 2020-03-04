import { beforeSend } from 'automan/services/request-client'

export default class AWSS3StorageClient {
    static upload(requestPath, file, progressCallback, completeCallback, index) {
        let options = {
            type: 'PUT',
            async: true,
            data: file,
            contentType: 'application/octet-stream',
            timeout: 200000,
            processData: false,
            xhr: function () {
                var XHR = $.ajaxSettings.xhr();
                if (XHR.upload) {
                    XHR.upload.addEventListener('progress', function (e) {
                        var progress = parseInt(e.loaded / e.total * 100);
                        progressCallback(progress)
                    }, false);
                }
                return XHR;
            },
        }
        let successCB = function (data) { completeCallback(index + 1) }
        let errorCB = function (data) { alert("Error occurred during file upload.") }
        RequestClient.s3put(requestPath, file, successCB, errorCB, options)
    }
}
