import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ObjectiveScreen from './src/screens/ObjectiveScreen';
import VisitorShowcaseScreen from './src/screens/VisitorShowcaseScreen';
import LocationInterestScreen from './src/screens/LocationInterestScreen';
import VisitorScreen from './src/screens/VisitorScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
        {/* Fluxo Onboarding / Visitante */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ObjectiveScreen" component={ObjectiveScreen} />
        <Stack.Screen name="VisitorShowcaseScreen" component={VisitorShowcaseScreen} />
        <Stack.Screen name="LocationInterest" component={LocationInterestScreen} />
        <Stack.Screen name="VisitorScreen" component={VisitorScreen} />

        {/* Fluxo Autenticação (Barreira de Login e Cadastro) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Fluxo Logado */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
