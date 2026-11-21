
import PublicClientApplication from 'react-native-msal';

import {
  MSAL_CONFIG,
  LOGIN_SCOPES,
} from '../config/msalConfig';

class MicrosoftAuthService {
  constructor() {
    this.pca = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized && this.pca) {
      return this.pca;
    }

    this.pca = new PublicClientApplication(MSAL_CONFIG);

    await this.pca.init();

    this.initialized = true;

    return this.pca;
  }

  // Microsoft interactive login
  async signIn() {
    try {
      const pca = await this.initialize();

      const result = await pca.acquireToken({
        scopes: LOGIN_SCOPES,
      });

      if (!result || !result.accessToken) {
        throw new Error('Microsoft authentication failed');
      }

      return {
        accessToken: result.accessToken,
        idToken: result.idToken,
        account: result.account,
        username: result.account?.username,
        name: result.account?.name,
      };

    } catch (error) {
      console.log('Microsoft Sign In Error:', error);
      throw error;
    }
  }

  // Silent login using cached Microsoft account
  async signInSilently() {
    try {
      const pca = await this.initialize();

      const accounts = await pca.getAccounts();

      if (!accounts || accounts.length === 0) {
        return null;
      }

      const result = await pca.acquireTokenSilent({
        account: accounts[0],
        scopes: LOGIN_SCOPES,
      });

      return {
        accessToken: result.accessToken,
        idToken: result.idToken,
        account: result.account,
        username: result.account?.username,
        name: result.account?.name,
      };

    } catch (error) {
      console.log('Silent Sign In Error:', error);
      return null;
    }
  }

  // Get Microsoft Graph user profile
  async getUserProfile(accessToken) {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Graph API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.log('Get Microsoft Profile Error:', error);
      throw error;
    }
  }

  // Logout
  async signOut() {
    try {
      const pca = await this.initialize();

      const accounts = await pca.getAccounts();

      if (accounts && accounts.length > 0) {
        await pca.signOut({
          account: accounts[0],
          signoutFromBrowser: false,
        });
      }

      return true;

    } catch (error) {
      console.log('Microsoft Logout Error:', error);
      throw error;
    }
  }
}

export default new MicrosoftAuthService();
