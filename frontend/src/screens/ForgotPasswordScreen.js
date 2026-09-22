import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSendResetEmail = async () => {
    setStatusMessage(null);

    if (!email.trim()) {
      const msg = 'Por favor, informe seu endereço de e-mail.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
      Alert.alert('Atenção', msg);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        console.log('Reset password notice:', error);
      }

      const successMsg = 'Se este e-mail estiver cadastrado em nossa plataforma, você receberá um link com as instruções para redefinir sua senha em instantes. Verifique sua caixa de entrada e spam.';
      setStatusMessage({
        type: 'success',
        text: successMsg,
      });
      Alert.alert('Instruções Enviadas', successMsg);
    } catch (err) {
      const successMsg = 'Se este e-mail estiver cadastrado em nossa plataforma, você receberá um link com as instruções para redefinir sua senha em instantes. Verifique sua caixa de entrada e spam.';
      setStatusMessage({
        type: 'success',
        text: successMsg,
      });
      Alert.alert('Instruções Enviadas', successMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar Senha</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="key" size={32} color="#1E88E5" />
        </View>

        <Text style={styles.title}>Esqueceu sua senha?</Text>
        <Text style={styles.subtitle}>
          Não se preocupe! Digite o e-mail cadastrado na sua conta para enviarmos um link de redefinição.
        </Text>

        {/* Banner de Feedback Inline */}
        {statusMessage ? (
          <View style={[
            styles.banner,
            statusMessage.type === 'success' ? styles.bannerSuccess : styles.bannerError
          ]}>
            <Feather
              name={statusMessage.type === 'success' ? 'check-circle' : 'alert-circle'}
              size={20}
              color={statusMessage.type === 'success' ? '#2E7D32' : '#D32F2F'}
              style={{ marginRight: 10, marginTop: 2 }}
            />
            <Text style={[
              styles.bannerText,
              statusMessage.type === 'success' ? styles.bannerTextSuccess : styles.bannerTextError
            ]}>
              {statusMessage.text}
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>E-mail da sua conta</Text>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#9E9E9E" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="exemplo@email.com"
            placeholderTextColor="#9E9E9E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (statusMessage) setStatusMessage(null);
            }}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSendResetEmail}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar Instruções</Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#1E88E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  bannerError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  bannerText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bannerTextSuccess: {
    color: '#1B5E20',
  },
  bannerTextError: {
    color: '#C62828',
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
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#333333',
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
