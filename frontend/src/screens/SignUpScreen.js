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
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

export default function SignUpScreen({ navigation, route }) {
  const { onboardingCep = '51020-010', onboardingGenres = ['Ficção', 'Romance'] } = route.params || {};

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cep, setCep] = useState(onboardingCep);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha nome, e-mail e senha.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Tenta chamar o backend FastAPI /auth/signup
      let token = null;
      try {
        const response = await api.post('/auth/signup', {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          cep: cep.trim(),
          favorite_genres: onboardingGenres,
        });
        token = response.data.access_token;
      } catch (errApi) {
        console.warn('Backend signup error, attempting direct Supabase signup:', errApi);
        // Fallback direto via Supabase Client
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;
        token = data.session?.access_token || 'mock-jwt-token-registered';
      }

      if (token) {
        await AsyncStorage.setItem('@giralivro:token', token);
        Alert.alert('Conta Criada!', 'Seu cadastro foi realizado com sucesso!', [
          {
            text: 'Ir para meu Perfil',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Profile' }],
              });
            },
          },
        ]);
      }
    } catch (error) {
      console.log('SignUp error:', error);
      Alert.alert(
        'Erro no Cadastro',
        error.response?.data?.detail || error.message || 'Não foi possível concluir o cadastro.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Conta</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>CRIE UMA CONTA GRÁTIS</Text>
        <Text style={styles.subtitle}>
          Junte-se à comunidade GiraLivro para trocar, vender e doar livros perto de você.
        </Text>

        {/* Nome Completo */}
        <Text style={styles.label}>Nome Completo</Text>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ex: Camila Silva"
            placeholderTextColor="#9E9E9E"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* E-mail */}
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

        {/* Senha */}
        <Text style={styles.label}>Senha (mínimo 6 caracteres)</Text>
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Escolha uma senha forte"
            placeholderTextColor="#9E9E9E"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* CEP / Localização */}
        <Text style={styles.label}>CEP de Entrega / Troca</Text>
        <View style={styles.inputContainer}>
          <Feather name="map-pin" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="51020-010"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
            value={cep}
            onChangeText={setCep}
          />
        </View>

        {/* Banner de preferências salvas */}
        <View style={styles.preferencesBadge}>
          <Feather name="check-circle" size={18} color="#43A047" style={{ marginRight: 8 }} />
          <Text style={styles.preferencesText}>
            Gêneros selecionados: {onboardingGenres.join(', ')}
          </Text>
        </View>

        {/* Botão Finalizar Cadastro */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Concluir Cadastro</Text>
          )}
        </TouchableOpacity>

        {/* Link para Login */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Fazer Login</Text>
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
  title: {
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
    marginBottom: 24,
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
    marginBottom: 16,
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
  preferencesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  preferencesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#2E7D32',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#43A047', // Verde Sustentável para cadastro positivo
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
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
