const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp, userName) => {
  const mailOptions = {
    from: `"MAISYS Medical AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'MAISYS - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1628; padding: 30px; text-align: center;">
          <h1 style="color: #00B4D8; margin: 0;">MAISYS</h1>
          <p style="color: #ffffff; margin: 5px 0;">Medical AI System</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px;">
          <h2 style="color: #1A2332;">Password Reset Request</h2>
          <p style="color: #64748B;">Hello ${userName},</p>
          <p style="color: #64748B;">Your OTP code to reset your password is:</p>
          <div style="background: #0A1628; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h1 style="color: #00B4D8; font-size: 40px; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #64748B;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #64748B;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #0A1628; padding: 15px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            MAISYS - Educational medical assistance, not a doctor
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };