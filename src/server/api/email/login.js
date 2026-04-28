const emailer = require("nodemailer");
const crypto = require("crypto");

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.EMAIL_PASSWORD;

const sender = emailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});


function email(target){

    const otp = crypto.randomInt(100000, 999999);
    
    const email = {
        from: EMAIL,
        to: target,
        subject: "Password Reset",
        text: `Here is your OTP: ${otp}`
   };

   sender.sendMail(email, (err, info) => {
       if(err){
           console.log(err);
       } else {
           console.log(info);
       }
   });

   return otp;
    
    
}


exports.email = email;