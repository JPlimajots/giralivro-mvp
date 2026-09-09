import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import ObjectiveScreen from './src/screens/ObjectiveScreen';
import VisitorShowcaseScreen from './src/screens/VisitorShowcaseScreen';
import LocationInterestScreen from './src/screens/LocationInterestScreen';
import VisitorScreen from './src/screens/VisitorScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import AddBookPhotoScreen from './src/screens/AddBookPhotoScreen';
import AddListingDetailsScreen from './src/screens/AddListingDetailsScreen';
import PublishSuccessScreen from './src/screens/PublishSuccessScreen';
import MyVirtualShelfScreen from './src/screens/MyVirtualShelfScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import BookDetailsScreen from './src/screens/BookDetailsScreen';

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

        {/* Fluxo Autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Fluxo Principal / Logado */}
        <Stack.Screen name="HomeLogado" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MyVirtualShelf" component={MyVirtualShelfScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="BookDetails" component={BookDetailsScreen} />

        {/* Fluxo de Anúncio / Publicação */}
        <Stack.Screen name="AddBookPhoto" component={AddBookPhotoScreen} />
        <Stack.Screen name="AddListingDetails" component={AddListingDetailsScreen} />
        <Stack.Screen name="PublishSuccess" component={PublishSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
