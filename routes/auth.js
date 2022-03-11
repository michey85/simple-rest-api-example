const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/authController');

const router = express.Router();

// и на создание и на обновление
router.put('/signup', [
  body('name').trim().not().isEmpty(),
  body('email').trim().isEmail().withMessage('Please enter a valid email').custom(isUserExists).normalizeEmail(),
  body('password').trim().isLength({min: 5}),
], authController.signup);

router.post('/login', authController.login);


module.exports = router;

// helpers
function isUserExists(value, {req}) {
  return User.findOne({email: value}).then(userDoc => {
    if (userDoc) {
      return Promise.reject('User with this email already exists!')
    }
  })
}