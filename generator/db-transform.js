'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports.dynamo = async (event) => {
  if (!(Array.isArray(event) && event.length)) {
    return 'Input needs to be an array of objects';
  }

  const items = [];
  event.forEach(element => {
    let dynamoElements = {};
    Object.keys(element).forEach(key => {
      dynamoElements[key] = { 'S': element[key] }
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
  
  return items;
};