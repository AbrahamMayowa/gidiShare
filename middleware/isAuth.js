const jwt = require('jsonwebtoken');

const User = require('../models/user')

module.exports = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      req.isAuth = false;
      return next();
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    let user
    try {
      decodedToken = jwt.verify(token, process.env.jwtSecret);
      user = await User.findById(decodedToken.userId)
    } catch (err) {
      req.isAuth = false;
      req.user = null
      return next(err);
    }
    if (!decodedToken) {
      req.isAuth = false;
      return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    if(user){
      req.user = user
    }
    next();
};
