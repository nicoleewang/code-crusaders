import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import supabase from '../config/db.js';

export const registerUser = async (email, password, givenName, familyName) => {
  // checks if fields are provided
  if (!email || !password || !givenName || !familyName) {
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
    const { data, error: insertError } = await supabase
      .from('user')
      .insert([{ email, password: hashedPW, givenName, familyName }])
      .select();

    if (insertError) {
      throw createHttpError(500, 'Error creating user in database');
    }

    // create JWT token
    const token = jwt.sign(
      { userId: data.id, email: data.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // optional
    );

    return { token: token };
    
  } catch (error) {
    if (!error.status) {
      throw createHttpError(500, 'Unexpected server error');
    }
    throw error; 
  }
};
