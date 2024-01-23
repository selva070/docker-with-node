const express = require('express');

const PORT = 3000;

const app = express();

app.get('/', (req, res) => {
  res.send('Hello From Express Server!');
});

app.listen(PORT, ()=>{
    console.log(`Node server listening on ${PORT}`);
});
