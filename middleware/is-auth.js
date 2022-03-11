const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.get('Authorization')?.split(' ')[1];
  if (!token) throw new Error('Not authenticated');

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  if (!decodedToken) throw new Error('Not authenticated');

  req.userId = decodedToken.userId;

  next();
}