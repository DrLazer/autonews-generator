'use strict';

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
});

module.exports.push = async (event) => {
  console.log(JSON.stringify(event));
  if (!event?.Records) {
    console.log('Event needs to be dynamo stream output');
    return;
  }
  
  for (record in event.Records) {
    if (record.eventName !== 'INSERT') {
      console.log('Not an insert, not adding to queue');
    }
    if (record.eventName === 'INSERT') {
      await sqs.sendMessage({
        QueueUrl: process.env.QUEUE_URL,
        // Any message data we want to send
        MessageBody: record.dynamodb.NewImage
      }).promise(); 
    }
  });
};