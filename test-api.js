const http = require('https');
http.get('https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,BBCA.JK', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log(data));
});
