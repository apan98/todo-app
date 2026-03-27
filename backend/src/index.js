
require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', taskRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
