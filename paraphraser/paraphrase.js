const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.go = async (event) => {
  try {
    for (const record of event.Records) {
      // Get the S3 object key from the event record
      const key = record.s3.object.key;

      // Get the JSON file contents from S3
      const params = {
        Bucket: record.s3.bucket.name,
        Key: key
      };
      const obj = await s3.getObject(params).promise();

      // Parse the JSON file contents
      const article = JSON.parse(obj.Body.toString());

      // Write the JSON contents to the serve S3 bucket
      const putParams = {
        Bucket: process.env.SERVE_BUCKET,
        Key: key,
        Body: JSON.stringify(article),
        ContentType: 'application/json'
      };
      await s3.putObject(putParams)
        .promise()
        .then(async (res) => {
          console.log('Successfully added article to serve bucket: ', res);

          // Delete the original S3 object if successfully written to serve bucket
          const deleteParams = {
            Bucket: record.s3.bucket.name,
            Key: key
          };
          await s3.deleteObject(deleteParams).promise();
          console.log('Successfully deleted article from original bucket.');
        })
        .catch(err => {
          console.error('Error uploading article to serve bucket ', err);
        });
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}