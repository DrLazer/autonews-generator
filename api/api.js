const express = require('express');
const serverless = require('serverless-http');
const app = express();

const { DynamoDB } = require("aws-sdk");
const db = new DynamoDB.DocumentClient()
const TableName = process.env.SOURCE_META_TABLE;

const queryItems = async (lastKey) => {
  const params = {
    TableName: TableName,
    IndexName: 'pubDateIndex',
    ScanIndexForward: false,
    Limit: 40,
  };
  if (lastKey) {
    params.ExclusiveStartKey = lastKey;
  }
  
}


app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, Mother Fucker!' });
});

app.get('/articles/feed', (req, res) => {

  const feedItems = [];
  let { lastEvaluatedKey, items } = queryItems(null);
  feedItems = feedItems.concat(items);

  while (lastEvaluatedKey != null) {
    { lastEvaluatedKey, items } = queryItems(lastEvaluatedKey);
    feedItems = feedItems.concat(items);
  }

  res.json({ message: 'Feed' });
});

module.exports.handler = serverless(app);