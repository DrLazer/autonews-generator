'use strict';

const { DynamoDB } = require("aws-sdk");
const db = new DynamoDB.DocumentClient()
const TableName = process.env.SOURCE_META_TABLE

module.exports.filter = async (event) => {
  if (!(Array.isArray(event.body) && event.body.length)) {
    return 'Input needs to be an array of objects';
  }

  const items = [];
  for (const element of event.body) {
    const params = {
      TableName: TableName,
      IndexName: 'linkIndex',
      ExpressionAttributeNames: {
        "#Link": "link"
      },
      ExpressionAttributeValues: {
        ":Link": element.link,
      },
      KeyConditionExpression: "#Link = :Link",
    }
    try {
      const queriedItems = await db.query(params).promise();
      if (queriedItems?.Count < 1) {
        items.push(element)
      }
    } catch (e) {
      console.log('Error querying DynamoDB items: ', e);
    }
  };

  return {
    statusCode: 200,
    body: items
  }
}