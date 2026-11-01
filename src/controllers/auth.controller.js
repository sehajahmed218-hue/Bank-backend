const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require("../services/email.servise");
const tokenBlackListModel = require("../models/blackList.model");

/** 
* - user register controller
* - POST /api/auth/register
*/

async function userRegisterController(req,res){
  const {email,name,password} = req.body;

  const isExisted = await userModel.findOne({
    email:email
  })

  if(isExisted){
    return res.status(422).json({
      message:"User already exists with email",
      status:"failed"
    })
  }

  const user = await userModel.create({
    email, name, password
  })

  const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"});

  res.cookie("token",token);

  res.status(201).json({
    user:{
      _id:user._id,
      email:user.email,
      name:user.name
    },
    token
  });

  await emailService.sendRegistrationEmail(user.email,user.name)

}

/** 
* - user login controller
* - POST /api/auth/login
*/

async function userLoginController(req,res){
  const {email,password} = req.body;

  const user = await userModel.findOne({email:email}).select("+password");
  if(!user)
  {
    return res.status(401).josn({
      message:"Email or password invalid"
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if(!isValidPassword)
  {
    return res.status(401).json({
      message:"Email or passwords is invalid"
    });
  }

  const token = jwt.sign({userId:user._id},process.env.JWT_SECRET, {expiresIn:"3d"});

  res.cookie("token",token);

  res.status(200).json({
    user:{
      _id:user._id,
      email:user.email,
      name:user.name
    },
    token
  });

}

/**
 * - user logout controller
 * - POST /api/auth/logout
 */
async function userLogOutController(req,res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if(!token)
  {
    return res.status(200).json({
      message:"User already logged out successfully"
    })
  }
  res.clearCookie("token");

  await tokenBlackListModel.create({
    token:token
  });

  return res.status(200).json({
    message:"User logged out successfully"
  });
}



module.exports = {
  userRegisterController,
  userLoginController,
  userLogOutController
}