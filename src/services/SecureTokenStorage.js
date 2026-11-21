
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'MICROSOFT_APP_ACCESS_TOKEN';

export const saveAuthToken = async token => {
  try {
    if (!token) {
      throw new Error('Token is empty');
    }

    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.log('Save token error:', error.message);
    return false;
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log('Get token error:', error.message);
    return null;
  }
};

export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.log('Clear token error:', error.message);
    return false;
  }
};
