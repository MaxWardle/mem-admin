'use strict';

var crypto = require('crypto');
var minio = require('minio');
var path = require('path');

/**
 * The minio client which facilitates the connection to minio, and through which all calls should be made.
 */
var minioClient = new minio.Client({
  endPoint: process.env.MINIO_HOST,
  port: 443,
  secure: true,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

// This is the list of known, valid buckets documents can be uploaded and downloaded from
var BUCKETS = {
  DOCUMENTS_BUCKET : 'uploads'
};
exports.BUCKETS = BUCKETS;

/**
 * Checks wether the provided bucket name is a valid (known) bucket.
 * @param bucket the name of the bucket
 * @return true if the bucket is valid, false otherwise
 */
var isValidBucket = function(bucket){
  if(bucket){
    for(var key in BUCKETS){
      if(BUCKETS[key] === bucket.toLowerCase()){
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns a 16-bit pseudo-random string to be used as file name for the storage.
 * @return the randomized file name
 * @see https://github.com/expressjs/multer/blob/ee5188d7499dd19c8596fe011e6f6e53ea4778d6/storage/disk.js#L7-L11
 */
var getRandomizedFileName = function(){
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Return the file extension, derived from the full file name
 * @return the file extension (example: txt)
 */
var getFileExtension = function(fileName){
  return fileName.match(/\.([0-9a-z]+$)/i)[1];
}

/**
 * Creates a bucket with the given name
 * @param bucket the name of the bucket
 * @return a promise that resolves with the result of the bucket creation operation
 */
var makeBucket = function (bucket) {
  return minioClient.makeBucket(bucket);
}

/**
 * Checks if the provided bucket name exists on Minio
 * @param bucket the name of the bucket
 * @return a promise that resolves with true if the bucket exists, false otherwise
 */
var bucketExists = function (bucket) {
  return new Promise(function (resolve, reject) {
    minioClient.bucketExists(bucket, function(err, exists) {
      // The API for `bucketExists` does not seem to match the documentation: it
      // returns an error with code 'NoSuchBucket' if a bucket does *not* exist.
      if (err && (err.code === 'NoSuchBucket' || err.code === 'NotFound')) {
        resolve(false);
        return;
      }

      // Any other error is a legit error.
      if (err && (err.code !== 'NoSuchBucket' && err.code !== 'NotFound')) {
        reject(err);
        return;
      }

      if (exists) {
        resolve(true);
      }

      resolve(false);
    });
  });
}

/**
 * Save an object to Minio.
 * The url can be used multiple times, but expires after 5 minutes.
 * @param bucket the minio bucket
 * @param projectCode a project code
 * @param fileName the name of the file
 * @param buffer the buffer containing the streamed file contents
 * @return a promise that resolves with an object containing the uploaded file information
 */
var putDocument = function (bucket, projectCode, fileName, buffer) {
  if(isValidBucket(bucket)){
    return bucketExists(bucket)
      .then(function(exists){
        if(!exists){
          return makeBucket(bucket);
        }
      })
      .then(function(){
        // generate randomized file name and append extension from original name
        var ext = getFileExtension(fileName);
        var newFileName = getRandomizedFileName() + (ext ? '.' + ext : '');
        var filePath = path.posix.join(projectCode, newFileName);
        minioClient.putObject(bucket, filePath, buffer);
        return {
          fullName: newFileName,
          extension: ext,
          path: filePath
        };
      });
  } else {
    return Promise.reject('[' + bucket + '] is not a valid bucket');
  }
};
exports.putDocument = putDocument;

/**
 * Delete a file from minio.
 * @param bucket the minio bucket
 * @param projectCode a project code
 * @param fileName the name of the file
 */
var deleteDocument = function (bucket, projectCode, fileName) {
  return minioClient.removeObject(bucket, projectCode + '/' + fileName)
    .then(function (result, err) {
      if (err) {
        throw err;
      }
      return result;
    })
};
exports.deleteDocument = deleteDocument;

/**
 * Get a minio presigned url, for a specific file object, that permits GET operations.
 * The url can be used multiple times, but expires after 5 minutes.
 * @param bucket the name of the bucket where the object is stored
 * @param filePath the file path for the file to retrieve.  Typically something like "projectCode/fileName"
 * @return a promise that resolves with the presigned url
 */
var getPresignedGETUrl = function (bucket, filePath) {
  return minioClient.presignedGetObject(bucket, filePath, 5 * 60)
    .then(function (url, err) {
      if (err) {
        throw err;
      }
      return url;
    });
};
exports.getPresignedGETUrl = getPresignedGETUrl;

/**
 * Wrappers for the above functions to add support for http request/response.
 */
var asHttpRequest = {
  /**
   * Wraps the existing function of the same name in a promise that supports http request/response.
   * @see getPresignedPUTUrl
   */
  deleteDocument: function (req, res) {
    return new Promise(function (resolve, reject) {
      return deleteDocument(BUCKETS.DOCUMENTS_BUCKET, req.params.projectCode, req.params.fileName)
        .then(
          function (result) {
            res.json(result);
          },
          function (error) {
            res.status(400).send({ message: error });
          })
        .then(resolve, reject);
    });
  }
}
exports.asHttpRequest = asHttpRequest;
