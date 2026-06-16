import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (NOT normal password)
  },
});

/**
 * SEND EMAIL VERIFICATION
 */
export const sendVerificationEmail = async (
  email: string,
  token: string
) => {
  const link = `${process.env.APP_URL}/api/auth/verify/${token}`;

  await transporter.sendMail({
    from: `"VetConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your VetConnect account',
    html: `
      <h2>Welcome to VetConnect</h2>
      <p>Please verify your account by clicking below:</p>
      <a href="${link}">Verify Account</a>
    `,
  });
};

/**
 * SEND PASSWORD RESET EMAIL
 */
export const sendResetEmail = async (
  email: string,
  token: string
) => {
  const link = `${process.env.APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"VetConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset</h2>
      <p>Click below to reset your password:</p>
      <a href="${link}">Reset Password</a>
    `,
  });
};