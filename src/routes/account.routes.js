const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");

const accountRouter = express.Router();

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */

accountRouter.post("/",authMiddleware.authMiddleware,accountController.createAccountController);

/**
 * - GET /api/account/
 * - Get all accounts of the logged-in user
 * - Protected route
 */

accountRouter.get("/",authMiddleware.authMiddleware,accountController.getUserAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 */

accountRouter.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController);

module.exports = accountRouter;