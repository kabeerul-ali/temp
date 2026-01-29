import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alifruitshop4u@gmail.com',
    pass: 'vksvieeftxzzbyni'
  }
});

const mailOptions = {
  from: 'alifruitshop4u@gmail.com',
  to: 'kabeerulali@gmail.com',
  subject: 'Test Email from Backend',
  text: 'This is a test email. If you receive this, email setup is working.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});