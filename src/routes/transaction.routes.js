const express = require('express');

const transactionRouter = express.Router();
const transactionController = require('../controllers/transaction.controller');
const  authMiddleware = require('../middleware/auth.middleware');

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transactionRouter.post("/",authMiddleware.authMiddleware,transactionController.createTransaction);

/**
 * - POST /api/transaction/system/initial-funds
 * - Create initial funds transaction from system user
 */

  transactionRouter.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction);

module.exports = transactionRouter;