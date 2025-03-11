import config from '../../config/test.json';
import supabase from '../../config/db.js';
import { 
  registerUserRequest
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