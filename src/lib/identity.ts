import { Authenticate } from './authentication';

export type User = {
  id: number;
  organization: Organization;
  organizations: Array<Organization>;
};
export type Organization = {
  id: number;
};

export type UserPayload = {
  user: User;
  organization: Organization | null;
};
type GetUserReturn = UserPayload | null;
class Identity {
  private _authentication: Authenticate;
  constructor(authentication: Authenticate) {
    this._authentication = authentication;
  }
  async getUser(): Promise<GetUserReturn> {
    if (
      !this._authentication.memory.getToken() &&
      !this._authentication.isLoggedIn()
    ) {
      return Promise.resolve(null);
    }
    try {
      const userRes = await this._authentication.request.get<User>(`/auth/me`);
      let orgRes;
      if (
        userRes.data &&
        userRes.data.organizations &&
        userRes.data.organizations.length
      ) {
        orgRes = await this._authentication.request.get<Organization>(
          `/organizations/${userRes.data.organizations[0].id}`
        );
      }

      return { user: userRes.data, organization: orgRes ? orgRes.data : null };
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default Identity;
