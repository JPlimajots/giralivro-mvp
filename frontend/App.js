import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/services/supabase';

// Fontes - carregadas na raiz para funcionar em TODAS as telas
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import ObjectiveScreen from './src/screens/ObjectiveScreen';
import VisitorShowcaseScreen from './src/screens/VisitorShowcaseScreen';
import LocationInterestScreen from './src/screens/LocationInterestScreen';
import VisitorScreen from './src/screens/VisitorScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
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
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Checar sessão real do Supabase
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setUserToken(session.access_token);
          await AsyncStorage.setItem('@giralivro:token', session.access_token);
        } else {
          // Se o Supabase estiver processando um redirecionamento OAuth na URL, aguarda o listener
          if (typeof window !== 'undefined' && (window.location?.hash?.includes('access_token') || window.location?.search?.includes('code'))) {
            console.log('OAuth URL callback detectada, aguardando processamento da sessão...');
            return;
          }
          setUserToken(null);
          await AsyncStorage.removeItem('@giralivro:token');
        }
      } catch (e) {
        console.warn('Erro ao checar sessão:', e);
        setUserToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listener do Supabase para login/logout (incluindo OAuth como Google)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, '| session:', !!session);

      if (event === 'SIGNED_OUT' || !session) {
        setUserToken(null);
        await AsyncStorage.removeItem('@giralivro:token');
        setIsLoading(false);
      } else if (session?.access_token) {
        setUserToken(session.access_token);
        await AsyncStorage.setItem('@giralivro:token', session.access_token);
        setIsLoading(false);

        // Garantir que a linha do usuário exista no banco public.profiles se for login Social (Google)
        if (session.user) {
          try {
            const { data: existing } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!existing) {
              await supabase.from('profiles').insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Leitor(a)',
                zip_code: session.user.user_metadata?.cep || '',
              });
            }
          } catch (err) {
            console.log('Profile auto-create notice:', err);
          }
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F6' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // Usuário Deslogado
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="ObjectiveScreen" component={ObjectiveScreen} />
            <Stack.Screen name="VisitorShowcaseScreen" component={VisitorShowcaseScreen} />
            <Stack.Screen name="LocationInterest" component={LocationInterestScreen} />
            <Stack.Screen name="VisitorScreen" component={VisitorScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </Stack.Group>
        ) : (
          // Usuário Logado
          <Stack.Group>
            <Stack.Screen name="HomeLogado" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="MyVirtualShelf" component={MyVirtualShelfScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
            <Stack.Screen name="AddBookPhoto" component={AddBookPhotoScreen} />
            <Stack.Screen name="AddListingDetails" component={AddListingDetailsScreen} />
            <Stack.Screen name="PublishSuccess" component={PublishSuccessScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
