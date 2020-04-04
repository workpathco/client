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

export { CodeVerifierError, DataError };
