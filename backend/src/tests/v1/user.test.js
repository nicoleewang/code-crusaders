import config from '../../config/test.json';
import supabase from '../../config/db.js';
import { 
  registerUserRequest,
  loginUserRequest,
  logoutUserRequest,
  getUserDetailsRequest
} from '../wrapper';

const port = config.port;
const url = config.url;

// constants
const password = 'password123';
const nameFirst = 'John';
const nameLast = 'Doe';

// NOTE!! have to delete test users from supabase each time running, not sure how to change it but it works for now

describe('POST /v1/user/register route', () => {
  test('success, registers user and returns 200 and token', async () => {
    const email1 = 'test1@example.com'
    const res = await registerUserRequest(email1, password, nameFirst, nameLast);
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email1)
      .single();

    expect(error).toBeNull();  
    expect(data).not.toBeNull();
    expect(data.email).toBe(email1);  
    expect(data.nameFirst).toBe(nameFirst); 
    expect(data.nameLast).toBe(nameLast); 
  });

  describe('error, missing a field', () => {
    test('email', async () => {
      const res = await registerUserRequest('', password, nameFirst, nameLast);
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });

    test('password', async () => {
      const res = await registerUserRequest('test2@example.com', '', nameFirst, nameLast);
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });

    test('first name', async () => {
      const res = await registerUserRequest('test3@example.com', password, '', nameLast);
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });

    test('last name', async () => {
      const res = await registerUserRequest('test4@example.com', password, nameFirst, '');
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });
  });

  describe('error, user already exists', () => {
    test('existing user', async () => {
      const email2 = 'test5@example.com'; // Define the email variable
      // Ensure the user exists
      await registerUserRequest(email2, password, nameFirst, nameLast);

      const res = await registerUserRequest(email2, password, nameFirst, nameLast);
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'User already exists');
    });
  });
});

describe('POST /v1/user/login route', () => {
  // register user for each test 
  registerUserRequest('guy@example.com', password, nameFirst, nameLast);

  test('success, logs in and returns 200 and token', async () => {
    const res = await loginUserRequest('guy@example.com', password);
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  describe('error, missing a field', () => {
    test('email', async () => {
      const res = await loginUserRequest('', password);
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });

    test('password', async () => {
      const res = await loginUserRequest('guy@example.com', '');
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toHaveProperty('error', 'All fields are required');
    });
  });

  test('error, user not found', async () => {
    const res = await loginUserRequest('nonexistent@example.com', password);
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(401);
    expect(body).toHaveProperty('error', 'User not found');
  });

  test('error, incorrect password', async () => {
    const res = await loginUserRequest('guy@example.com', 'wrongPW69');
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(401);
    expect(body).toHaveProperty('error', 'Invalid email or password');
  });
});

describe('POST /v1/user/logout route', () => {
  let token;
  // register before test
  registerUserRequest('logout@example.com', 'password123', 'John', 'Doe');

  beforeAll(async () => {
    // log in before test
    token = JSON.parse(loginUserRequest('logout@example.com', 'password123').body).token
  });

  test('success, logs out and returns 200', async () => {
    const res = await logoutUserRequest(token); 
    const body = res.body.toString().trim();

    expect(res.statusCode).toBe(200);
    expect(body).toBe('');
    const setCookieHeader = res.headers['set-cookie'];
    // verify the cookie is cleared
    expect(setCookieHeader).toBeDefined(); 
    expect(setCookieHeader[0]).toMatch(/authToken=;/); 
    expect(setCookieHeader[0]).toMatch(/Expires=/); 
  });

  test('error, invalid token', async () => {
    const res = await logoutUserRequest('invalidToken');
    const body = JSON.parse(res.body.toString()); 

    expect(res.statusCode).toBe(401);
    expect(body).toHaveProperty('error', 'Invalid token');
    expect(typeof body.error).toBe('string');
     // check header is undefined
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeUndefined();
  });
});

describe('GET /v1/user/details', () => { 
  const token =  JSON.parse(registerUserRequest('getDetails@example.com', password, nameFirst, nameLast).body).token;

  test('Successfully retrieves user details and returns 200', async () => {
    const res = await getUserDetailsRequest(token);
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(200);
    expect(body).toStrictEqual({email: 'getDetails@example.com', nameFirst, nameLast});
  });

  test('Invalid token, return 401', async () => {
    const res = await getUserDetailsRequest('Invalid Token Given');
    const body = JSON.parse(res.body.toString()); 
  
    expect(res.statusCode).toBe(401);
    expect(body).toHaveProperty('error', 'Invalid token');
    expect(typeof body.error).toBe('string');
  });
});
