import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import supabase from '../config/db.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// cookies omnom
const app = express();
app.use(cookieParser());

export const registerUser = async (email, password, nameFirst, nameLast) => {
  // checks if fields are provided
  if (!email || !password || !nameFirst || !nameLast) {
    throw createHttpError(400, 'All fields are required');
  }

  try {
    // check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw createHttpError(500, 'Database error while checking existing user');
    }

    if (existingUser) {
      throw createHttpError(400, 'User already exists');
    }

    // hash pw
    const hashedPW = await bcrypt.hash(password, 10);

    // insert new user into supabase
    const { data: user, error: insertError } = await supabase
      .from('user')
      .insert([{ email, password: hashedPW, nameFirst, nameLast }])
      .select();

    if (insertError) {
      throw createHttpError(500, 'Error creating user in database');
    }

    // generate JWT token
    const token = jwt.sign(
      {
        email: user[0].email,
        nameFirst: user[0].nameFirst,
        nameLast: user[0].nameLast
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // optional
    );

    return { token };
  } catch (error) {
    if (!error.status) {
      throw createHttpError(500, 'Unexpected server error' + error);
    }
    throw error;
  }
};

export const loginUser = async (email, password) => {
  // checks if fields are provided
  if (!email || !password) {
    throw createHttpError(400, 'All fields are required');
  }

  try {
    // find user by email
    const { data: user, error: findError } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    // error handling
    if (!user) {
      throw createHttpError(401, 'User not found');
    }

    if (findError) {
      throw createHttpError(500, 'Database error');
    }

    // compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw createHttpError(401, 'Invalid email or password');
    }

    if (!process.env.JWT_SECRET) {
      throw createHttpError(500, 'Server configuration error');
    }

    // create JWT token
    const token = jwt.sign(
      {
        email: user.email,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // optional
    );

    return { token };
  } catch (error) {
    if (!error.status) {
      throw createHttpError(500, 'Unexpected server error' + error);
    }
    throw error;
  }
};

export const logoutUser = async (req, res) => {
  try {
    // clear cookie
    res.clearCookie('authToken', { httpOnly: true, secure: true });
  } catch (error) {
    throw createHttpError(500, 'Failed to logout user. Please try again.'); ;
  }
};

export const getUserDetails = async (email) => {
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('*')
    .eq('email', email);

  if (fetchError) {
    throw createHttpError(500, `Failed to fetch user details: ${fetchError.message}`);
  }

  return {
    email: user[0].email,
    nameFirst: user[0].nameFirst,
    nameLast: user[0].nameLast
  };
};

export const sendUserResetCode = async (email) => {
  const resetCode = crypto.randomBytes(4).toString('hex');
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data: user, error: invalidUser } = await supabase
    .from('user')
    .select('*')
    .eq('email', email)
    .single();

  if (invalidUser) {
    throw createHttpError(401, email, ' does not belong to a registered user');
  }

  const { error: codeError } = await supabase
    .from('user')
    .update({ resetCode, codeExpirationTime: expirationTime })
    .eq('email', email);

  if (codeError) {
    throw createHttpError(500, `Failed to upsert reset code: ${codeError.message}`);
  }

  const transporter = await nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'codecrusaders100@gmail.com',
      pass: 'thnp fdsb jklz focg'
    }
  });

  const { error: emailError } = await transporter.sendMail({
    from: '"Code Crusaders" <codecrusaders100@gmail.com>',
    to: email,
    subject: 'Reset Password',
    html: await htmlEmailContent(user.nameFirst + ' ' + user.nameLast, resetCode),
  });
  if (emailError) {
    throw createHttpError(500, `Failed to send email with reset code: ${emailError}`);
  }

  return { resetCode };
};

const htmlEmailContent = (name, resetCode) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #9370db;
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px #9370db;
      }

      h2 {
        color: #333;
        font-size: 24px;
        text-align: center;
      }

      .content {
        margin-top: 20px;
        font-size: 16px;
        color: #555;
        line-height: 1.6;
      }

      .reset-code {
        display: block;
        margin: 20px 0;
        padding: 12px;
        font-size: 18px;
        background-color: #f7f7f7;
        color: #333;
        font-weight: bold;
        text-align: center;
        border-radius: 4px;
        border: 1px solid #ddd;
      }

      .cta-button {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 16px;
        color: #fff;
        background-color: #007bff;
        text-decoration: none;
        border-radius: 4px;
        text-align: center;
        width: 100%;
      }

      .cta-button:hover {
        background-color: #0056b3;
      }

      .footer {
        margin-top: 30px;
        font-size: 14px;
        color: #777;
        text-align: center;
      }

      .footer a {
        color: #007bff;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Password Reset Request</h2>
      
      <div class="content">
        <p>Dear ${name},</p>
        <p>We received a request to reset your password. Please use the following code to reset your password:</p>
        
        <div class="reset-code">
          ${resetCode}
        </div>
        
        <p>This code will expire in 5 minutes, so please use it as soon as possible.</p>
        <p>If you didn’t request a password reset, you can safely ignore this email.</p>
        
        <a href="[Reset Password Link]" class="cta-button">Reset Your Password</a>
      </div>
      
      <div class="footer">
        <p>If you have any questions or need further assistance, feel free to <a href="mailto:codecrusaders100@gmail.com">contact our support team</a>.</p>
        <p>Kind Regards,<br>Code Crusaders</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
