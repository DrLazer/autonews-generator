'use strict';

const { Configuration, OpenAIApi } = require("openai");

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.testprompt = async (event) => {
  const configuration = new Configuration({
    apiKey: "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"
  });

  const openai = new OpenAIApi(configuration);

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Write a poem about how whippets are the greatest breed of dog",
    max_tokens: 100,
  });
  return JSON.stringify(completion.data);
};
