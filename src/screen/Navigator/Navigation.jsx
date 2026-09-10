import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from '../Common/WelcomeScreen';
import DashbaordScreen from '../Common/DashbaordScreen';





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
      </Stack.Navigator>

    </SafeAreaProvider>


  );
};

export default Navigation;