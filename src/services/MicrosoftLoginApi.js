
import axios from 'axios';

const BASE_URL = 'https://leafcom.us/backend/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Microsoft login
export const mobileMicrosoftLogin = async microsoftAccessToken => {
  const response = await api.post(
    '/chat-application/mobileMicrosoftLogin',
    {
      access_token: microsoftAccessToken,
    },
  );

  return response.data;
};

// Multiple account selection
export const selectMicrosoftAccount = async (
  selectionToken,
  accountKey,
) => {
  const response = await api.post(
    '/chat-application/mobileMicrosoftLogin',
    {
      selection_token: selectionToken,
      account: accountKey,
    },
  );

  return response.data;
};
