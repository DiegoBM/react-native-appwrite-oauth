import 'react-native-gesture-handler';
import React, { useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './LoginScreen';
import AccountScreen from './AccountScreen';
import AuthContext from './AuthContext';

const Stack = createStackNavigator();

export default function App() {
  const [auth, setAuth] = useState(false);
  const authContext = useMemo(
    // This prevents context from changing unnecessarily when auth changes
    // therefore components that use this context won't re-render when
    // the sign in state changes (if they are not meant to, of course)
    () => ({
      signIn: () => setAuth(true),
      signOut: () => setAuth(false),
    }),
    [setAuth]
  );

  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        <Stack.Navigator>
          {!auth ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Account" component={AccountScreen} />
          )}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}
