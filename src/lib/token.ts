export type Token = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'bearer';
};
class T {
  private _token: Token;
  removeToken(): void {
    this._token = null;
  }

  setToken(token: Token): void {
    this._token = token;
  }

  getToken(): Token {
    return this._token;
  }
}

export default T;
