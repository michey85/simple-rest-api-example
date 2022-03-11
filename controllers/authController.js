const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Invalid data was entered!');
    error.data = errors.array();
    throw error;
  };

  const {name, email, password} = req.body;

  bcrypt.hash(password, 12)
    .then(hashedPass => {
      return User.create({
        email,
        name,
        password: hashedPass,
        posts: [],
      })
    })
    .then(user => {
      res.status(201).json({msg: 'USer was registered', userId: user._id})
    })
    .catch(next)
}

exports.login = (req, res, next) => {
  const {email, password} = req.body;
  let loadedUser;

  User.findOne({email})
    .then(user => {
      if (!user) throw new Error('User doesnt exists!');

      loadedUser = user;
      return bcrypt.compare(password, user.password)
    })
    .then(isPassCorrect => {
      if (!isPassCorrect) throw new Error('Wrong password!');

      const userId = loadedUser._id.toString();
      const token = jwt.sign({
          email: loadedUser.email,
          userId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      res.status(200).json({token, userId})
    })
    .catch(next)
}