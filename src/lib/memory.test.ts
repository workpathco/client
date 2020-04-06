// tslint:disable:no-expression-statement
import Memory, { Token } from './memory';

const _token: Token = {
  expires_in: 3, // 3 seconds
  access_token: 'token_data',
  scope: 'offline_ccess',
  token_type: 'bearer'
};
function createTokenObject() {
  return new Memory();
}

beforeEach(() => {
  jest.useFakeTimers();
});

describe('Token::setToken', () => {
  test('sets token', () => {
    const memory = createTokenObject();
    memory.setToken(_token);
    const testToken = memory.getToken();
    expect(testToken).toMatchObject(_token);
  });
  test('removes token after expires_in time', () => {
    const memory = createTokenObject();
    memory.setToken(_token);
    expect(setTimeout).toHaveBeenLastCalledWith(memory.removeToken, 3000);
  });
});
describe('Token::getToken', () => {
  test('gets token', () => {
    const memory = createTokenObject();
    memory.setToken(_token);
    const testToken = memory.getToken();
    expect(testToken).toMatchObject(_token);
  });
});
describe('Token::removeToken', () => {
  test('removes token', () => {
    const memory = createTokenObject();
    memory.setToken(_token);
    memory.removeToken();
    const testToken = memory.getToken();
    expect(testToken).toEqual(null);
  });
});
