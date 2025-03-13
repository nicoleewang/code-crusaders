import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import supabase from '../config/db.js';
import express from 'express'; 
import cookieParser from 'cookie-parser';
import validator from 'validator';

// cookies omnom
const app = express();
app.use(cookieParser());

/**
 * Registers a new user in the database after validating the input fields and password strength.
 * 
 * @param {string} email - The email address of the user to be registered.
 * @param {string} password - The password for the user. Must meet the specified strength requirements.
 * @param {string} nameFirst - The first name of the user. Should not include special characters or numbers.
 * @param {string} nameLast - The last name of the user. Should not include special characters or numbers.
 * @returns {Object} An object containing a JWT token for the newly registered user.
 */
export const registerUser = async (email, password, nameFirst, nameLast) => {
  // checks if fields are provided
  if (!email || !password || !nameFirst || !nameLast) {
    throw createHttpError(400, 'All fields are required');
  }

  const isEmailValid = validator.isEmail(email);
  if (!isEmailValid) {
    throw createHttpError(400, 'Invalid email');
  }

  // length
  if (password.length < 8) {
    throw createHttpError(400, 'Password is too short');
  }

  // upper case char
  if (!(/[A-Z]/.test(password))) {
    throw createHttpError(400, 'Password requires an uppercase character');
  } 
  
  // lower case char
  if (!(/[a-z]/.test(password))) {
    throw createHttpError(400, 'Password requires a lowercase character');
  } 
  
  // number
  if (!(/[0-9]/.test(password))) {
    throw createHttpError(400, 'Password requires a number');
  }

  // special char
  if (!(/[!@#$%^&*(),.?":{}|<>]/.test(password))) {
    throw createHttpError(400, 'Password requires a special character');
  }

  // invalid character in name
  if ((/[!@#$%^&*(),.?":{}|<>]/.test(nameFirst)) || 
      (/[!@#$%^&*(),.?":{}|<>]/.test(nameLast)) || 
      (/[0-9]/.test(nameFirst)) || 
      (/[0-9]/.test(nameLast))) {
        throw createHttpError(400, 'Invalid character in name');
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
      { email: user[0].email,
        nameFirst: user[0].nameFirst, 
        nameLast: user[0].nameLast 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } //optional
    );

    return { token };
    
  } catch (error) {
    if (!error.status) {
      throw createHttpError(500, 'Unexpected server error' + error);
    }
    throw error; 
  }
};

/**
 * Authenticates a user by validating the input fields and checking the provided credentials.
 * 
 * @param {string} email - The email address of the user attempting to log in.
 * @param {string} password - The password for the user attempting to log in.
 * @returns {Object} An object containing a JWT token for the user.
 */
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
        { email: user.email,
          nameFirst: user.nameFirst, 
          nameLast: user.nameLast 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } //optional
      );

    return { token };

  } catch (error) {
    if (!error.status) {
      throw createHttpError(500, 'Unexpected server error' + error);
    }
    throw error; 
  }
};

/**
 * Logs out a user by clearing the authentication cookie.
 * 
 * @param {Object} req - The request object (not used in this function, but typically available in Express route handlers).
 * @param {Object} res - The response object, used to clear the authentication cookie.
 * @returns {void} Does not return a value.
 */

export const logoutUser = async (req, res) => {
  try {
    // clear cookie
    res.clearCookie('authToken', { httpOnly: true, secure: true });
  } catch (error) {
    throw error; 
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
    }

};
