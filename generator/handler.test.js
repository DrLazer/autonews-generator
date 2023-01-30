const { hello, testprompt } = require('./handler');

test('suggest a nme for a superhero', async () => {
  const event = {};
  const context = {};
  const callback = (error, response) => {
    expect(response.statusCode).toBe(200);
  };

  console.log(await testprompt(event, context, callback));
});