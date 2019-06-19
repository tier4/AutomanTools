export default class AzureBlobClient {
  static upload(file, accessInfo, progressCallback, completeCallback, index) {
    //return promise
    return new Promise(function(resolve) {
      const sasToken = accessInfo['sas'];
      const containerName = accessInfo['container'];
      const blobURI = accessInfo['base_uri'];
      console.log('in AzureBlobClient');

      const blobService = AzureStorage.Blob.createBlobServiceWithSas(
        blobURI,
        sasToken
      );

      const customBlockSize =
        file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
      blobService.singleBlobPutThresholdInBytes = customBlockSize;

      const options = {
        blockSize: customBlockSize,
        contentSettings: {
          contentDisposition: 'attachment'
        }
      };

      // beforeUpload();

      let finishedOrError = false;
      const speedSummary = blobService.createBlockBlobFromBrowserFile(
        containerName,
        file.name,
        file,
        options,
        (error, result, response) => {
          finishedOrError = true;
          if (error) {
            console.error('upload error');
            return;
          }
          console.log('upload successfully');
          // afterUpload();
          progressCallback(100);
          resolve(completeCallback(index + 1));
        }
      );

      function refreshProgress() {
        setTimeout(() => {
          if (!finishedOrError) {
            let progress = speedSummary.getCompletePercent();
            console.log(progress);
            progressCallback(progress);
            refreshProgress();
          }
        }, 200);
      }

      refreshProgress();
    });
  }
}
