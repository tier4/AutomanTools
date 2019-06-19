import { beforeSend } from 'automan/services/request-client'

export default class LocalStorageClient {
  static upload(requestPath, file, progressCallback, completeCallback, index) {
    let fd = new FormData();
    let options = {
      type: "post",
      async: true,
      data: fd,
      contentType: false,
      processData: false,
      xhr : function() {
        var XHR = $.ajaxSettings.xhr();
        if(XHR.upload){
          XHR.upload.addEventListener('progress', function(e){
            var progress = parseInt(e.loaded/e.total*100);
            progressCallback(progress)
          }, false);
        }
        return XHR;
      },
    }
    fd.append('file', file);
    let successCB = function(data) { completeCallback(index + 1) }
    let errorCB = function(data) { alert("Error occurred during file upload.") }
    RequestClient.post(requestPath, fd, successCB, errorCB, options)
  }
}
