const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
const db = require('./src/models');

app.use(cors());
app.use(express.json());

const routes = require('./routes');
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

db.sequelize.sync().then(() => {
    console.log("Database synced");
});
