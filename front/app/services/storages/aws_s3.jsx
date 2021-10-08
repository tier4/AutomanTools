import RequestClient from 'automan/services/request-client'
import AWS from "aws-sdk";

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

  static multipart_upload(s3Info, file, progressCallback, completeCallback, index) {
    const options = {
      handleProgress: e => {
        const progress = parseInt(e.loaded / e.total * 100);
        progressCallback(progress);
      }
    };

    // console.debug("s3 info");
    // console.debug(JSON.stringify(s3Info));
    // console.debug("file name:" + file.name);
    // console.debug("file size:" + file.size);
    // console.debug("file type:" + file.type);

    const s3 = new AWS.S3({
      accessKeyId: s3Info.aws_access_key_id,
      secretAccessKey: s3Info.aws_secret_access_key,
      sessionToken: s3Info.aws_session_token,
      region: "ap-northeast-1" });

    const params = {
      Bucket: s3Info.bucket,
      Key: s3Info.key,
      Body: file
    };

    s3.upload(params, (error, data) => {
      if (error) {
        console.error(JSON.stringify(error));
        alert("Error occurred during s3 multipart upload.");
      } else {
        console.debug(JSON.stringify(data));
        completeCallback(index + 1);
      }
    });
  }
}
