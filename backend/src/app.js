const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => res.json({ success: true, message: 'OK' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
