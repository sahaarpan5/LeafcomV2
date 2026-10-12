import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from '../Common/WelcomeScreen';
import DashbaordScreen from '../Common/DashbaordScreen';
import UserChatPage from '../Common/UserChatPage';
import GroupChat from '../Common/GroupChat';





const Stack = createNativeStackNavigator();

const Navigation = () => {

  return (
    <SafeAreaProvider >

      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="WelcomeScreen">
        {/* <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} /> */}

        <Stack.Screen name="WelcomeScreen">
          {({ navigation }) => (
            <WelcomeScreen
              onFinish={() => navigation.replace('DashbaordScreen')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="DashbaordScreen" component={DashbaordScreen} />
         <Stack.Screen name="UserChatPage" component={UserChatPage} />
          <Stack.Screen name="GroupChat" component={GroupChat} />
      </Stack.Navigator>

    </SafeAreaProvider>


  );
};

export default Navigation;