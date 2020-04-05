export type Token = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'bearer';
};
class T {
  private _token: Token;
  private _selfDestruction: NodeJS.Timeout;
  _setSelfDestruction() {
    if (this._selfDestruction) {
      clearTimeout(this._selfDestruction);
    }
    this._selfDestruction = setTimeout(
      () => this.removeToken(),
      this._token.expires_in * 60
    );
  }

  removeToken(): void {
    this._token = null;
  }

  setToken(token: Token): void {
    this._token = token;
    this._setSelfDestruction();
  }

  getToken(): Token {
    return this._token;
  }
}

export default T;
