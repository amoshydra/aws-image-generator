const handler = require('./handler');

handler.hello({
  queryStringParameters: {
    i: 'https://images.pexels.com/photos/905165/pexels-photo-905165.jpeg?w=200&h=200&auto=compress&cs=tinysrgb',
  }
}, null, (err, res) => {
  console.log(err, res);
})
