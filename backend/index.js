// index.js
const express = require('express');
const app = express();
const routes = require('./routes/index'); // import routes

app.use(express.json());
app.use('/', routes); // attach all routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
