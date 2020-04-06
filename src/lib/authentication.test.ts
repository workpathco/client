// tslint: disable: no - expression - statement;
import { Authenticate } from './authentication';
const options = {
  redirect_uri: 'http://localhost',
  client_id: 'client_id',
  scope: 'offline_access'
};
describe('Authenticate', () => {
  test('test', () => {
    new Authenticate(options);
  });
});
