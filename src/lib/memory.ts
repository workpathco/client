export type Token = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'bearer';
};

/**
 * Responsible of minify given string containing JavaScript code. By default it uses the foo-bar minimization algorithm.
 *
 * **Warning: if you don't specify an output in the configuration your input file will be overridden !**
 *
 * Basic usage example:
 *
 * ```ts
 * import {minify} from 'foobar-minify';
 * const config = {
 *   input: readFileSync('dist/awesome-app.js'),
 *   output: createWriteStream('dist/awesome-app.min.js')
 * }
 *   minify(config);
 * ```
 */
class Memory {
  private _token: Token;
  private _selfDestruction: NodeJS.Timeout;

  /**
   * Deletes token from memory
   */
  removeToken = (): void => {
    this._token = null;
  };

  /**
   * Sets token to memory
   */
  setToken(token: Token): void {
    this._token = token;
    this._setSelfDestruction();
  }

  /**
   * Gets token from memory
   */
  getToken(): Token {
    return this._token;
  }

  private _clearSelfDestruction() {
    clearTimeout(this._selfDestruction);
  }
  private _setSelfDestruction() {
    if (this._selfDestruction) {
      this._clearSelfDestruction();
    }
    this._selfDestruction = setTimeout(
      this.removeToken,
      this._token.expires_in * 1000
    );
  }
}

export default Memory;
