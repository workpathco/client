import Lock from 'browser-tabs-lock';
import * as storage from './storage';
import Crypto from './crypto';
import Transactioner, { Transaction } from './transactioner';
import { AuthenticationError, DataError } from './error';
import Iframe from './iframe';
import initializeClientRequest from './request';
import Memory, { Token } from './memory';
import { AxiosInstance } from 'axios';

/**
 * @ignore
 */
export const LOGGED_IN_KEY = '_wp_logged';
/**
 * @ignore
 */
const lock = new Lock();
/**
 * @ignore
 */
const RENEW_LOCK_KEY = '_wp_lock_renew';

/**
 * @ignore
 */
export type AuthorizationUrl = string;
/**
 * @ignore
 */
export type UrlPayload = {
  prompt?: string;
  response_mode?: string;
};
export type AuthenticationOptions = {
  redirect_uri: string;
  client_id: string;
  scope?: string;
  auth_domain?: string;
  id_domain?: string;
};
/**
 * @ignore
 */
export type ConsumePayload = {
  state: string;
  code: string;
  error: string;
  error_description: string;
};
const DEFAULT_AUTH_DOMAIN = 'https://api-prod.workpath.co';
const DEFAULT_ID_DOMAIN = 'https://id.workpath.co';
class Authenticate {
  private _options: AuthenticationOptions = {
    redirect_uri: null,
    client_id: null,
    auth_domain: DEFAULT_AUTH_DOMAIN,
    id_domain: DEFAULT_ID_DOMAIN
  };

  public memory: Memory;
  private _iframe: Iframe;
  private _transactioner: Transactioner;
  private _request: AxiosInstance;

  constructor(options: AuthenticationOptions) {
    this._options = { ...this._options, ...options };
    this.memory = new Memory();
    this._iframe = new Iframe();
    this._transactioner = new Transactioner();
    this._request = initializeClientRequest(this._options.auth_domain);
  }

  private async url(
    payload: UrlPayload = {}
  ): Promise<AuthorizationUrl | void> {
    try {
      const state = Crypto.randomString(32);
      const codeVerifier = Crypto.randomString(32);
      const code_challenge = await Crypto.sha256(codeVerifier);

      const authorizationEndpointUrl = new URL(
        `${this._options.auth_domain}/oauth/authorize`
      );

      // here we encode the authorization request
      const searchParams = new URLSearchParams({
        state,
        code_challenge,
        response_type: 'code',
        code_challenge_method: 'S256',
        client_id: this._options.client_id,
        redirect_uri: this._options.redirect_uri,
        ...payload
      });
      const transactionParams: Transaction = {
        code_verifier: codeVerifier,
        redirect_uri: this._options.redirect_uri
      };

      if (this._options.scope) {
        searchParams.set('scope', this._options.scope);
        transactionParams.scope = this._options.scope;
      }

      this._transactioner.create(state, transactionParams);

      authorizationEndpointUrl.search = searchParams.toString();
      return authorizationEndpointUrl.toString();
    } catch (err) {
      throw new Error(
        `Error creating authorization url. Reason: ${err.message}`
      );
    }
  }

  async logout() {
    this.removeIsLoggedIn();
    this.memory.removeToken();

    const logoutUrl = new URL(`${this._options.id_domain}/logout`);
    const params = new URLSearchParams({
      redirect_uri: this._options.redirect_uri,
      client_id: this._options.client_id
    });
    logoutUrl.search = params.toString();
    window.location.href = '';
    window.location.assign(logoutUrl.toString());
  }

  async login() {
    const authUrl = await this.url();
    if (authUrl) {
      window.location.href = '';
      window.location.assign(authUrl);
    }
  }

  async renew(): Promise<Token | null> {
    // If we already have a token, just return it
    const token = this.memory.getToken();
    if (this.isLoggedIn() && token) {
      return token;
    }
    const authUrl = await this.url({
      prompt: 'none',
      response_mode: 'web_message'
    });
    if (authUrl) {
      const transactioner = this._transactioner;
      try {
        await lock.acquireLock(RENEW_LOCK_KEY, 5000);
        const response = await this._iframe.run(
          authUrl,
          this._options.auth_domain
        );
        await this.consume(response);
        return this.memory.getToken();
      } catch (err) {
        const _url = new URL(authUrl);
        const params = new URLSearchParams(_url.search);
        transactioner.remove(params.get('state'));
        throw err;
      } finally {
        await lock.releaseLock(RENEW_LOCK_KEY);
      }
    }
    return null;
  }
  async consume(
    {
      state: _state,
      code,
      error: _error,
      error_description: _error_description
    }: ConsumePayload = {
      state: null,
      code: null,
      error: null,
      error_description: null
    }
  ): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    if (
      !_state &&
      !_error &&
      !Array.from((params as unknown) as Iterable<URLSearchParams>).length
    ) {
      throw new Error('There are no query params available for parsing.');
    }

    const state = _state || params.get('state');
    const error = _error || params.get('error');
    const error_description =
      _error_description || params.get('error_description');
    const transaction = this._transactioner.get(state);
    if (!transaction) {
      throw new AuthenticationError('StateError', 'State not found', state);
    }

    this._transactioner.remove(state);

    if (error) {
      throw new AuthenticationError(error, error_description, state);
    }

    const requestParams = new URLSearchParams({
      code_verifier: transaction.code_verifier,
      code: code || params.get('code'),
      code_method_challenge: 'S256',
      grant_type: 'authorization_code',
      client_id: this._options.client_id,
      redirect_uri: this._options.redirect_uri
    });

    if (transaction.scope) {
      requestParams.set('scope', transaction.scope);
    }
    const response = await this._request.post(
      '/oauth/token',
      requestParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (!response || !response.data) {
      throw new DataError();
    }
    this.memory.setToken(response.data);
    this.setIsLoggedIn();
  }
  private setIsLoggedIn() {
    let twelveHoursFromNow = new Date();
    twelveHoursFromNow.setHours(twelveHoursFromNow.getHours() + 12);
    storage.save(LOGGED_IN_KEY, '1', { expires: twelveHoursFromNow });
  }
  private removeIsLoggedIn() {
    storage.remove(LOGGED_IN_KEY);
  }
  isLoggedIn(): boolean {
    return !!storage.get(LOGGED_IN_KEY);
  }
  public get scope() {
    return this._options.scope;
  }
  public get redirect_uri() {
    return this._options.redirect_uri;
  }
  public get client_id() {
    return this._options.client_id;
  }
  public get request() {
    return this._request;
  }
}
export { Authenticate };
