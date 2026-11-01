const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host:'smtp.gmail.com',
//   port: 587,
//   secure:false,
//   auth:{
//     type: 'OAuth2',
//     user:process.env.EMAIL_USER,
//     clientId:process.env.CLIENT_ID,
//     clientSecret:process.env.CLIENT_SECRET,
//     refreshToken:process.env.REFRESH_TOKEN,
//   },
// });

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,

  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN
  },

  tls: {
    servername: 'smtp.gmail.com'
  }
});

// transporter.verify((error,success)=>{
//   if(error)
//   {
//     console.log("Error connecting to email server",error);
//   }
//   else
//   {
//     console.log("Email server is ready to send messages");
//   }
// });

const sendEmail = async(to,subject,text,html)=>{
  try{
    const info = await transporter.sendMail({
      from:`"Backend ledger"<${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Message sent: %s',info.messageId);
    // console.log('Preview URL: %s',nodemailer.getTestMessageUrl(info));
    
  }
  catch (error){
    console.log('Error sending email:',error);
  }
};

async function sendRegistrationEmail(userEmail,name) {
  const subject = 'Welcome to backend ledger';
  const text = `Hello ${name},\n\nThank You for registering at Backend Ledger.We are excited to have you on board!\n\nBest Regards,\nThe Backend Ledger Team `;
  const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. Were excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail,name,amount,toAccount) {
  const subject = 'Transaction Successful!';
  const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful`;
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful</p>`;

  await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionFailureEmail(userEmail,name,amount,toAccount) {
  const subject = 'Transaction failed!';
  const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} was failed`;
  const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} was successful</p>`;

  await sendEmail(userEmail,subject,text,html);  
}

module.exports = {
  transporter,
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail
}