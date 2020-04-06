// tslint:disable:no-expression-statement
import Transactioner, { COOKIE_KEY, getTransactionKey } from './transactioner';
const transaction = {
  scope: 'offline_access',
  code_verifier: 'random_string',
  redirect_uri: 'http://localhost'
};
function deleteAllCookies() {
  var cookies = document.cookie.split(';');

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf('=');
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}
// beforeEach(() => {});
afterEach(() => {
  deleteAllCookies();
});
describe('getTransactionKey', () => {
  test('gets transaction key', () => {
    const key = 'test';
    const transactionKey = getTransactionKey(key);
    expect(transactionKey).toEqual(`${COOKIE_KEY}${key}`);
  });
});
describe('Transactioner', () => {
  test('creats transaction', () => {
    const transactioner = new Transactioner();
    const testState = 'test_state';
    transactioner.create(testState, transaction);
    const testTransaction = transactioner.get(testState);
    expect(testTransaction).toEqual(expect.objectContaining(transaction));
  });
  test('gets transaction', () => {
    const transactioner = new Transactioner();
    const testState = 'test_state';
    transactioner.create(testState, transaction);
    const testTransaction = transactioner.get(testState);
    expect(testTransaction).toEqual(expect.objectContaining(transaction));
  });
  test('removes transaction', () => {
    const transactioner = new Transactioner();
    const testState = 'test_state';
    transactioner.create(testState, transaction);
    transactioner.remove(testState);
    const testTransaction = transactioner.get(testState);
    expect(testTransaction).toEqual(undefined);
  });
  test('loads previous transactions', () => {
    const transactioner1 = new Transactioner();
    const testState = 'test_state';
    transactioner1.create(testState, transaction);
    const transactioner2 = new Transactioner();
    const testTransaction = transactioner2.get(testState);
    expect(testTransaction).toEqual(expect.objectContaining(transaction));
  });
});
