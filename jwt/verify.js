import jwt from 'jsonwebtoken';
import config from './authjwt.js';
import User from '../model/user.js';

 const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};
 const checkDuplicateEmail = async (req, res, next) => {
    try {
      const user = await User.findOne({
        email: req.body.email,
      });
  
      if (user) {
        return res.status(400).send({ message: 'Failed! Email is already in use!' });
      }
  
      next();
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  };
  
export default {verifyToken, checkDuplicateEmail}