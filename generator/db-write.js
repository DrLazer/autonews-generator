'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports.dynamo = async (event) => {
  if (!(Array.isArray(event) && event.length)) {
    return 'Input needs to be an array of objects';
  }

  let params = {
    RequestItems: {
     "SourceMeta": event
    }
  };
};