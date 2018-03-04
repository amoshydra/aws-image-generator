'use strict';
const imageGenerator = require('./index');

const reply = (callback, stream) => {
  stream.toBuffer()
    .then((buffer) => {
      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      })
    })
    .catch(callback);
};

module.exports.hello = (event, context, callback) => {
  const url = event.queryStringParameters && event.queryStringParameters.i;
  if (!url) {
    imageGenerator.getPlaceholder()
      .then((res) => reply(callback, res))
      .catch(callback);
    return;
  }

  const options = Object.assign({ url, }, event.queryStringParameters);
  imageGenerator.generateImage(options)
    .then(res => reply(callback, res))
    .catch((error) => {
      imageGenerator.getPlaceholder()
        .then(res => reply(callback, res))
        .catch(callback);
      return;
    })
};
