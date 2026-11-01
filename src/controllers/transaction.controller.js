const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const emailService = require('../services/email.servise');
const accountModel = require('../models/account.model');
const userModel = require('../models/user.model');
const mongoose = require('mongoose');
const { resolve } = require('nodemailer/lib/shared/url.js');

/**
 * * - Create a new  transaction
 * - validate request
 * - validate idemptoncy key
 * - check account status
 * - 
 */

async function createTransaction(req,res) {
  /**
   * - Validate request
   */
  const {fromAccount,toAccount,amount,idempotencyKey} = req.body;
  if(!fromAccount || !toAccount || !idempotencyKey || amount<=0)
  {
    return res.status(400).json({
      message:"FromAccount,toAccount,amount and idempotency key is required"
    });
  }
   
  const fromUserAccount = await accountModel.findOne({
    _id:fromAccount
  });
  const toUserAccount = await accountModel.findOne({
    _id:toAccount
  });

  if(!fromUserAccount || !toUserAccount)
  {
    return res.status(400).json({
      message:"Invalid fromAccount or toAccount"
    });
  }

  /**
   * - Validate idempotency key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey:idempotencyKey
  })

  /**
   * - Check duplicate transaction
   */

  if(isTransactionAlreadyExists)
  {
    if(isTransactionAlreadyExists.status === "COMPLETED")
    {
      return res.status(200).json({
        message:"Transation already processed",
        transaction:isTransactionAlreadyExists
      });
    }
    if(isTransactionAlreadyExists.status === "PENDING")
    {
      return res.status(200).json({
        message:"Transaction is still processing"
      });
    }
    if(isTransactionAlreadyExists.status === 'FAILED')
    {
      return res.status(500).json({
        message:"Transaction failed,please retry"
      });
    }
    if(isTransactionAlreadyExists.status === 'REVERSED')
    {
      return res.status(500).json({
        message:"Transaction was reversed,please retry"
      });
    }
  }

  /**
   * - Validate account status
   */

  if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE")
  {
    return res.status(400).json({
      message:"Both fromAccount and toAccount must be ACTIVE to process transaction"
    });
  }

  /**
 * - Derive sender balance from ledger
 */

  const balance = await fromUserAccount.getBalance();

  if(balance<amount)
  {
    return res.status(400).json({
      message:`Insufficient balance. Current balance is ${balance}, Requested amount is ${amount}`
    });
  }

  /**
   * - Create transaction (PENDING)
   */

  const session = await mongoose.startSession();
  try
  {
     session.startTransaction();

    const [transaction] = await transactionModel.create([{
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status:"PENDING",
    }],{
      session
    })

    const debitLedgerEntry = await ledgerModel.create([{
      account: fromAccount,
      amount:amount,
      transaction: transaction._id,
      type:"DEBIT"
    }],{
      session
    })

    await(()=>{
      return new Promise((resolve)=> setTimeout(resolve,100));      
    })()

    const creditLedgerEntry = await ledgerModel.create([{
      account: toAccount,
      amount:amount,
      transaction:  transaction._id,
      type:"CREDIT"
    }],{
      session
    })

    transaction.status = "COMPLETED";
    await transaction.save({session});

    await session.commitTransaction();

    /**
     * - Send email notification
     */

    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount
    );

    return res.status(201).json({
      message:"Transaction completed successfully",
      transaction:transaction
    })
  }
  catch(error)
  {
    await session.abortTransaction();
    
    console.error("Transaction failed:",error);

    return res.status(400).json({
      message:"Transaction failed"
    });
  }
  finally{
    session.endSession();
  }
}

async function createInitialFundsTransaction(req,res) {
  const {toAccount,amount,idempotencyKey} = req.body;

  if(!toAccount || amount<=0 || !idempotencyKey)
  {
    return res.status(400).json({
      message:"toAccount , amount and idempotency key are required"
    })
  }

  const existingTransaction = await transactionModel.findOne({
    idempotencyKey
  });

  if (existingTransaction) {
    return res.status(200).json({
        message: "Transaction already processed",
        transaction: existingTransaction
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id:toAccount
  });

  if(!toUserAccount)
  {
    return res.status(400).json({
      message:"Invalid toAccount"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    user:req.user._id
  })

  if(!fromUserAccount)
  {
    return res.status(400).json({
      message:"System user Account not found"
    })
  }

  const session = await mongoose.startSession();
  try{
    session.startTransaction();

    const [transaction] = await transactionModel.create([{
      fromAccount:fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status:"PENDING"
    }],{
      session
    })

    const debitLedgerEntry = await ledgerModel.create([{
      account:fromUserAccount._id,
      amount:amount,
      transaction:transaction._id,
      type:"DEBIT"
    }],{
      session
    })

    const creditLedgerEntry = await ledgerModel.create([{
      account:toAccount,
      amount:amount,
      transaction:transaction._id,
      type:"CREDIT"
    }],{
      session
    })

    transaction.status = "COMPLETED";
    await transaction.save({session});

    await session.commitTransaction();

    return res.status(201).json({
      message:"Initial funds transaction completed successfully",
      transaction:transaction
    })

  }
  catch(error)
  {
    await session.abortTransaction();
    
    console.error("Transaction failed:",error);

    return res.status(500).json({
      message:"Transaction failed"
    });
  }
  finally{
    await session.endSession();
  }

}

module.exports = {
  createTransaction,
  createInitialFundsTransaction
}