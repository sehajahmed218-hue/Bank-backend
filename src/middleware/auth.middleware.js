const tokenBlackListModel = require("../models/blackList.model");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req,res,next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if(!token)
  {
    return res.status(401).json({
      message:"Unauthorized access , token is missing"
    });
  }  

  const isBlackListed = await tokenBlackListModel.findOne({token:token});

  if(isBlackListed)
  {
    return res.status(401).json({
      message:"Unauthorized access,token is invalid"
    })
  }

  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);
    req.user = user;
    return next();
  }catch(error)
  {
    return res.status(401).json({
      message:"Unauthorized access, token is invalid"
    })
  }
}

async function authSystemUserMiddleware(req,res,next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if(!token)
  {
    return res.status(401).json({
      message:"Unauthorized access,token is missing"
    })
  }

  const isBlackListed = await tokenBlackListModel.findOne({token:token});

  if(isBlackListed)
  {
    return res.status(401).json({
      message:"Unauthorized access,token is invalid"
    })
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const systemUser = await userModel.findById(decoded.userId).select("+systemUser");

    if(!systemUser)
    {
      return res.status(403).json({
        message:"Forbidden access, not a system user"
      })
    }

    req.user = systemUser;

    return next();

  }
  catch(error)
  {
    console.error("JWT ERROR:", error);

    return res.status(401).json({
      message:"Unauthorized access, token is invalid"
    })
  }
}

module.exports = {
  authMiddleware,
  authSystemUserMiddleware
}