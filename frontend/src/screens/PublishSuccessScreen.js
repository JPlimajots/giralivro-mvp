import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function PublishSuccessScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check-circle" size={64} color="#43A047" />
        </View>

        <Text style={styles.title}>Publicação Concluída!</Text>
        <Text style={styles.subtitle}>
          Seu livro já está visível para milhares de leitores na comunidade GiraLivro.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MyVirtualShelf' }],
            });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Ver Minha Estante Virtual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeLogado' }],
            });
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Ir para o Início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#666666',
  },
});
