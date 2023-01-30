const { getrss } = require('./bbc');

test('getrss', async () => {
  const event = {};
  const context = {};
  const callback = (error, response) => {
    expect(response.statusCode).toBe(200);
  };

  console.log(await getrss(event, context, callback));
});