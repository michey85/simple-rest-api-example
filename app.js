const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const multer = require('multer');
require('dotenv').config();

const postRouter = require('./routes/posts');
const authRouter = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const filename = new Date().toISOString() + '-' + file.originalname;

    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if ([
    'image/png',
    'image/jgp',
    'image/jgep',
    'image/gif',
  ].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(null, false);
  }
}

app.use(helmet());
app.use(bodyParser.json());
app.use(multer({
  storage: fileStorage,
  fileFilter,
}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((_, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  next();
});

app.use('/api/posts', postRouter);
app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;

  res.status(status).json({error: err, msg: err.message, data: err.data,})
})

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log('DB connected.');
  app.listen(process.env.PORT || 3000);
}).catch(console.error)

