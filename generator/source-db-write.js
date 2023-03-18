'use strict';

const { DynamoDB } = require("aws-sdk");
const db = new DynamoDB.DocumentClient()
const TableName = process.env.DYNAMO_SINGLE_TABLE

module.exports.dynamo = async (event) => {
  if (!(Array.isArray(event) && event.length)) {
    return 'Input needs to be an array of objects';
  }

  // Build the batches
  var batches = [];
  var current_batch = [];
  var item_count = 0;
  for (var x in event) {
      // Add the item to the current batch
      item_count++;
      current_batch.push(event[x]);
      // If we've added 25 items, add the current batch to the batches array
      // and reset it
      if(item_count%25 == 0) {
          batches.push(current_batch);
          current_batch = [];
      }
  }
  // Add the last batch if it has records and is not equal to 25
  if (current_batch.length > 0 && current_batch.length != 25) batches.push(current_batch);

  for (x in batches) {
    let params = {
      RequestItems: {
        [process.env.DYNAMO_SINGLE_TABLE]: batches[x]
      }
    };
    
    // Perform the batchWrite operation
    try {
      //require("util").inspect.defaultOptions.depth = null;
      //console.log(params);
      await db.batchWrite(params).promise();
    } catch (e) {
      console.log(e);
    }
    return;
  }
};