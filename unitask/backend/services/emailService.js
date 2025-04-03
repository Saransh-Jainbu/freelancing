const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send email
async function sendEmail(options) {
  try {
    const { to, subject, html, text } = options;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"UniTask" <notifications@unitask.com>',
      to,
      subject,
      html,
      text,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Verify email connection on startup
function verifyEmailConnection() {
  if (process.env.NODE_ENV === 'production') {
    transporter.verify((error) => {
      if (error) {
        console.error('Email configuration error:', error);
      } else {
        console.log('Email server ready to send messages');
      }
    });
  }
}

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
