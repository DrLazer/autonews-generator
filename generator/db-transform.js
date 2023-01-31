'use strict';

import { v4 as uuidv4 } from 'uuid';

module.exports.dynamo = async (event) => {
  if (!(Array.isArray(event.body) && event.body.length)) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: 'Input needs to be an array of objects',
          input: event,
        },
        null,
        2
      ),
    };
  }

  const items = [];
  event.body.forEach(element => {
    let dynamoElements = {};
    Object.keys(element).forEach(key => {
      dynamoElements[key]: { 'S': element[key] }
    });

    let item = {
      PutRequest: {
        Item: {
          'Id': { 'S': uuidv4() },
          ...dynamoElements
        }
      }
    };
    items.push(item);
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(
      items,
      null,
      2
    ),
  };
};