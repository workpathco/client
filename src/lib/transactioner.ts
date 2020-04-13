import * as storage from './storage';
export const COOKIE_KEY = '_wp_txs_';
export const getTransactionKey = (state: string) => `${COOKIE_KEY}${state}`;
export type Transaction = {
  scope?: string;
  code_verifier: string;
  redirect_uri: string;
};
type Transactions = {
  [key: string]: Transaction;
};
class Transactioner {
  private transactions: Transactions;
  constructor() {
    this.transactions = {};
    storage
      .getAllKeys()
      .filter(k => k.startsWith(COOKIE_KEY))
      .forEach(k => {
        const state = k.replace(COOKIE_KEY, '');
        this.transactions[state] = storage.get<Transaction>(k);
      });
  }
  public create(state: string, transaction: Transaction) {
    this.transactions[state] = transaction;
    let fifteenMinutesFromNow = new Date();

    fifteenMinutesFromNow.setMinutes(fifteenMinutesFromNow.getMinutes() + 15);
    storage.save(getTransactionKey(state), transaction, {
      expires: fifteenMinutesFromNow
    });
  }
  public get(state: string): Transaction {
    return this.transactions[state];
  }
  public remove(state: string) {
    delete this.transactions[state];
    storage.remove(getTransactionKey(state));
  }
}

export default Transactioner;
