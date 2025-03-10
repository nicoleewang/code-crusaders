import config from '../../config/test.json';
import supabase from '../../config/db.js';
import { 
  registerUserRequest
} from '../wrapper';

const port = config.port;
const url = config.url;

// constants
const email = 'test@example.com';
const password = 'password123';
const nameFirst = 'John';
const nameLast = 'Doe';

describe('POST /v1/user/register route', () => {
  test('success, registers user and returns 200 and token', async () => {
    const res = await registerUserRequest(email, password, nameFirst, nameLast);
    const body = JSON.parse(res.body.toString());

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');

    // check if valid jwt 
    const tokenParts = body.token.split('.');
    expect(tokenParts.length).toBe(3); 
    tokenParts.forEach((part) => {
      expect(part).toMatch(/^[A-Za-z0-9\-_.]+$/); 
    });

    const decodedToken = jwtDecode(body.token);
    const userId = decodedToken.userId;

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    expect(error).toBeNull();  
    expect(data).not.toBeNull();
    expect(data.email).toBe(email);  
    expect(data.nameFirst).toBe(nameFirst); 
    expect(data.nameLast).toBe(nameLast); 
  });
});