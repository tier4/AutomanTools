import RequestClient from 'automan/services/request-client'

export default class LocalStorageClient {
  static upload(requestPath, file, progressCallback, completeCallback, index) {
    const fd = new FormData();
    fd.append('file', file);

    const options = {
      handleProgress: e => {
        const progress = parseInt(e.loaded / e.total * 100);
        progressCallback(progress);
      }
    };

    RequestClient.post(requestPath, fd, options)
      .then((data) => {
        completeCallback(index + 1);
      }, (err) => {
        alert("Error occurred during file upload.");
      });
  }
}
