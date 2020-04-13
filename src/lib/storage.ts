import * as Cookies from 'es-cookie';

type ClientStorageOptions = Cookies.CookieAttributes;

export const getAllKeys = () => Object.keys(Cookies.getAll() || {});

export const get = <T extends Object>(key: string) => {
  const value = Cookies.get(key);
  if (typeof value === 'undefined') {
    return null;
  }
  return <T>JSON.parse(value);
};
export const save = (
  key: string,
  value: any,
  options: ClientStorageOptions = {
    expires: 1
  }
) => {
  Cookies.set(key, JSON.stringify(value), options);
};
export const remove = (key: string) => {
  Cookies.remove(key);
};
