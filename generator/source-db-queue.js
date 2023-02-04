'use strict';

const { DynamoDB } = require("aws-sdk");
const db = new DynamoDB.DocumentClient()
const TableName = process.env.SOURCE_META_TABLE

module.exports.push = async (event) => {
  console.log(event);
};