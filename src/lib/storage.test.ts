// tslint:disable:no-expression-statement
import * as Cookies from 'es-cookie';
import * as storage from './storage';

function deleteAllCookies() {
  var cookies = document.cookie.split(';');

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf('=');
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}
beforeEach(() => {
  deleteAllCookies();
});
function createCookies(keys: Array<string>) {
  keys.forEach(key => {
    Cookies.set(key, JSON.stringify('1'));
  });
}
describe('getAllKeys', () => {
  test('gets all keys', () => {
    const keys = ['test1', 'test2', 'test3'];
    createCookies(keys);
    const allKeys = storage.getAllKeys();
    expect(allKeys).toEqual(expect.arrayContaining(keys));
  });
});
describe('save', () => {
  test('saves', () => {
    const key = 'test1';
    const value = 'testValue';
    storage.save(key, value);
    const testValue = JSON.parse(Cookies.get(key));
    expect(testValue).toEqual(value);
  });
});

describe('get', () => {
  test('gets', () => {
    const key = 'test1';
    const value = 'testValue';
    Cookies.set(key, JSON.stringify(value));
    const testValue = storage.get(key);
    expect(testValue).toEqual(value);
  });
  test('returns null if no cookie', () => {
    const testValue = storage.get('test');
    expect(testValue).toEqual(null);
  });
});
describe('remove', () => {
  test('removes', () => {
    const key = 'test1';
    const value = 'testValue';
    Cookies.set(key, JSON.stringify(value));
    storage.remove(key);
    const testValue = Cookies.get(key);
    expect(testValue).toEqual(undefined);
  });
});

// export const save = (
//   key: string,
//   value: any,
//   options: ClientStorageOptions = {
//     daysUntilExpire: 1
//   }
// ) => {
//   Cookies.set(key, JSON.stringify(value), {
//     expires: options.daysUntilExpire
//   });
// };
// export const remove = (key: string) => {
//   Cookies.remove(key);
// };
