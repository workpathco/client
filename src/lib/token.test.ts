// tslint:disable:no-expression-statement
import T, { Token } from './token';

const _token: Token = {
  expires_in: 3, // 3 seconds
  access_token: 'token_data',
  scope: 'offline_ccess',
  token_type: 'bearer'
};
function createTokenObject() {
  return new T();
}

beforeEach(() => {
  jest.useFakeTimers();
});

describe('Token::setToken', () => {
  test('sets token', () => {
    const token = createTokenObject();
    token.setToken(_token);
    const testToken = token.getToken();
    expect(testToken).toMatchObject(_token);
  });
  test('removes token after expires_in time', () => {
    const token = createTokenObject();
    token.setToken(_token);
    expect(setTimeout).toHaveBeenLastCalledWith(token.removeToken, 3000);
  });
});
describe('Token::getToken', () => {
  test('gets token', () => {
    const token = createTokenObject();
    token.setToken(_token);
    const testToken = token.getToken();
    expect(testToken).toMatchObject(_token);
  });
});
describe('Token::removeToken', () => {
  test('removes token', () => {
    const token = createTokenObject();
    token.setToken(_token);
    token.removeToken();
    const testToken = token.getToken();
    expect(testToken).toEqual(null);
  });
});
// export type Token = {
//   access_token: string;
//   expires_in: number;
//   scope: string;
//   token_type: 'bearer';
// };
// class T {
//   private _token: Token;
//   private _selfDestruction: NodeJS.Timeout;
//   _setSelfDestruction() {
//     if (this._selfDestruction) {
//       clearTimeout(this._selfDestruction);
//     }
//     this._selfDestruction = setTimeout(
//       () => this.removeToken(),
//       this._token.expires_in * 60
//     );
//   }

//   removeToken(): void {
//     this._token = null;
//   }

//   setToken(token: Token): void {
//     this._token = token;
//     this._setSelfDestruction();
//   }

//   getToken(): Token {
//     return this._token;
//   }
// }

// export default T;
