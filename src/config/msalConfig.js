import {Platform} from 'react-native';

export const CLIENT_ID = '87910398-5fee-4158-bc79-cb505698e6b7';

export const TENANT_ID = '9728fcf8-f04b-4271-b352-022a33fbfcc4';

export const AUTHORITY =
  `https://login.microsoftonline.com/${TENANT_ID}`;

export const REDIRECT_URI = Platform.select({
  android: 'msauth://com.leafcom/SpEuaAHuFwK2oB4svnapEqBLO1I=',
  ios: 'msauth.com.yourcompany.yourapp://auth',
});

export const MSAL_CONFIG = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: REDIRECT_URI,
  },
};

export const LOGIN_SCOPES = [
  'User.Read',
  'openid',
  'profile',
  'email',
];