import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../Screens/Home/HomeScreen';
import ShortsScreen from '../Screens/Media/MediaScreen';
import VoiceScreen from '../Screens/Voice/VoiceScreen';
import WeatherScreen from '../Screens/Weather/WeatherScreen';
import ShopScreen from '../Screens/Shop/ShopScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Media') {
            iconName = focused ? 'film' : 'film-outline';
          } else if (route.name === 'Laxmi') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Weather') {
            iconName = focused ? 'sunny' : 'sunny-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Media" component={ShortsScreen} />
      <Tab.Screen name="Laxmi" component={VoiceScreen} />
      <Tab.Screen name="Weather" component={WeatherScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;