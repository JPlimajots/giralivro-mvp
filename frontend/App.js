import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ObjectiveScreen from './src/screens/ObjectiveScreen';
import VisitorShowcaseScreen from './src/screens/VisitorShowcaseScreen';
import LocationInterestScreen from './src/screens/LocationInterestScreen';
import VisitorScreen from './src/screens/VisitorScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ObjectiveScreen" component={ObjectiveScreen} />
        <Stack.Screen name="VisitorShowcaseScreen" component={VisitorShowcaseScreen} />
        <Stack.Screen name="LocationInterest" component={LocationInterestScreen} />
        <Stack.Screen name="VisitorScreen" component={VisitorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
