const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3001;
const { sequelize } = require('../models');

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', require('../routes/auth'));
app.use('/api/tasks', require('../routes/tasks'));
app.use('/api/categories', require('../routes/categories'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    app.listen(port, () => {
      console.log(`Backend listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

start();
