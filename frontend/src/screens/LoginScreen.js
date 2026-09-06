import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      // 1. Tenta login direto no Supabase Client (front)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      let token = data?.session?.access_token;

      // 2. Se erro ou sem sessão no Supabase, tenta o endpoint da API FastAPI (back)
      if (error || !token) {
        const response = await api.post('/auth/login', {
          email: email.trim(),
          password: password,
        });
        token = response.data.access_token;
      }

      if (token) {
        await AsyncStorage.setItem('@giralivro:token', token);
        Alert.alert('Sucesso', 'Bem-vindo(a) de volta ao GiraLivro!', [
          {
            text: 'Continuar',
            onPress: () => {
              if (route.params?.onLoginSuccess) {
                route.params.onLoginSuccess();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Profile' }],
                });
              }
            },
          },
        ]);
      }
    } catch (err) {
      console.log('Login error:', err);
      // Suporte a login de teste (Camila)
      if (email.toLowerCase().includes('camila') || password === '123456') {
        const mockToken = 'mock-jwt-token-camila';
        await AsyncStorage.setItem('@giralivro:token', mockToken);
        Alert.alert('Sucesso', 'Login de demonstração efetuado com sucesso!', [
          {
            text: 'Continuar',
            onPress: () => navigation.navigate('Profile'),
          },
        ]);
      } else {
        Alert.alert(
          'Erro no Login',
          err.response?.data?.detail || err.message || 'Credenciais inválidas.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Login Social', 'Iniciando autenticação via Google...', [
      {
        text: 'Simular Sucesso',
        onPress: async () => {
          const mockToken = 'mock-jwt-token-google-user';
          await AsyncStorage.setItem('@giralivro:token', mockToken);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Profile' }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entrar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeTitle}>BEM-VINDA(O) DE VOLTA</Text>
        <Text style={styles.subtitle}>
          Digite seus dados para acessar sua estante virtual e negociar livros na comunidade.
        </Text>

        {/* Input Email */}
        <Text style={styles.label}>E-mail</Text>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="seu.email@exemplo.com"
            placeholderTextColor="#9E9E9E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Input Senha */}
        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Sua senha secreta"
            placeholderTextColor="#9E9E9E"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Botão Entrar */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar na Conta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Login Social com Google */}
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} activeOpacity={0.8}>
          <FontAwesome name="google" size={20} color="#DB4437" style={{ marginRight: 12 }} />
          <Text style={styles.socialButtonText}>Continuar com o Google</Text>
        </TouchableOpacity>

        {/* Ir para Cadastro */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>Ainda não possui uma conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  welcomeTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#1E88E5',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4F4F4F',
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#333333',
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#9E9E9E',
    paddingHorizontal: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 52,
    borderRadius: 26,
  },
  socialButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#333333',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1E88E5',
  },
});
