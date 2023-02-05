'use strict';

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
});

module.exports.push = async (event) => {
  if (!event?.Records) {
    console.log('Event needs to be dynamo stream output');
    return;
  }
  
  for (let i in event.Records) {
    let record = event.Records[i];
    if (record.eventName !== 'INSERT') {
      console.log('Not an insert, not adding to queue');
    }
    if (record.eventName === 'INSERT') {
      await sqs.sendMessage({
        QueueUrl: process.env.SCRAPE_QUEUE_URL,
        // Any message data we want to send
        MessageBody: JSON.stringify(record.dynamodb.NewImage);
      }).promise(); 
    }
  };
};