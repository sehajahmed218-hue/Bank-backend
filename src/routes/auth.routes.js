const express = require("express");
const authController = require("../controllers/auth.controller");

const authRouter = express.Router();

/* POST /api/auth/register */
authRouter.post("/register",authController.userRegisterController);

/* POST /api/auth/login */
authRouter.post("/login",authController.userLoginController);

/**
 * POST /api/auth/logout
 */
authRouter.post("/logout",authController.userLogOutController)

module.exports = authRouter;