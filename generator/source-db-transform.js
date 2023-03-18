'use strict';

const { v4: uuidv4 } = require('uuid');
const { DateTime } = require("luxon");

module.exports.dynamo = async (event) => {
  if (!(Array.isArray(event) && event.length)) {
    return 'Input needs to be an array of objects';
  }

  const items = [];
  event.forEach(element => {
    let dynamoElements = {};
    Object.keys(element).forEach(key => {
      if (key === 'pubDate') {
        dynamoElements[key] = DateTime.fromHTTP(element[key]).toUnixInteger();
      } else {
        dynamoElements[key] = element[key];
      }
    });

    let item = {
      PutRequest: {
        Item: {
          'Pk': 'source-article',
          'Sk': uuidv4(),
          ...dynamoElements
        }
      }
    };
    items.push(item);
  });
  
  return items;
};