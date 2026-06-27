require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running' } });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
