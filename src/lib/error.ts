class CodeVerifierError extends Error {
  constructor() {
    super();
    this.message = 'Code verifier not found';
    this.name = 'CodeVerifierError';
  }
}

class DataError extends Error {
  constructor() {
    super();
    this.message = 'Data not found';
    this.name = 'DataError';
  }
}
class AuthenticationError extends Error {
  public error: string;
  public error_description: string;
  public state: string;
  constructor(error: string, error_description: string, state: string) {
    super(error_description);
    this.error = error;
    this.state = state;
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
export { AuthenticationError, CodeVerifierError, DataError };
