// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import ProfileScreen from './Screens/Home/ProfileScreen';
import Estimator from './Screens/Home/Estimator';
import LoginScreen from './Screens/Login/Login'; 

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" // start at Login
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Estimator" component={Estimator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
