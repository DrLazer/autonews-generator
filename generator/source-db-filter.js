'use strict';

const { DynamoDB } = require("aws-sdk");
const db = new DynamoDB.DocumentClient()
const TableName = process.env.SOURCE_META_TABLE

module.exports.filter = async (event) => {
  if (!(Array.isArray(event.body) && event.body.length)) {
    return 'Input needs to be an array of objects';
  }

  const items = [];
  event.body.forEach(element => {

  });
  
  return {};
};