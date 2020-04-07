import RequestClient from 'automan/services/request-client'

export default class AWSS3StorageClient {
  static upload(requestPath, file, progressCallback, completeCallback, index) {
    const options = {
      handleProgress: e => {
        const progress = parseInt(e.loaded / e.total * 100);
        progressCallback(progress);
      }
    };

    RequestClient.put(requestPath, file, options)
      .then((data) => {
        completeCallback(index + 1);
      }, (err) => {
        alert("Error occurred during file upload.");
      });
  }
}
