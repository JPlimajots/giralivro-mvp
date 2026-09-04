import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
    let [fontsLoaded] = useFonts({
        Nunito_700Bold,
        Nunito_800ExtraBold,
        Inter_400Regular,
        Inter_600SemiBold,
    });

    if (!fontsLoaded) {
        return <View style={styles.loadingContainer} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#1E88E5" />
                <Text style={styles.logoText}>
                    <Text style={{ color: '#1E88E5' }}>Gira</Text>
                    <Text style={{ color: '#43A047' }}>Livro</Text>
                </Text>
            </View>

            <View style={styles.illustrationContainer}>
                <View style={styles.circleOuter}>
                    <View style={styles.circleInner}>
                        <MaterialCommunityIcons name="book-open-outline" size={54} color="#1E88E5" />
                    </View>
                    <View style={styles.badge}>
                        <MaterialCommunityIcons name="leaf" size={16} color="#FFFFFF" />
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.headline}>Renove sua estante com zero esforço.</Text>

                <View style={styles.infoCard}>
                    <Feather name="users" size={20} color="#1E88E5" style={styles.cardIcon} />
                    <Text style={styles.cardText}>
                        Nossa plataforma conecta você a uma rede de leitores na sua região, organizando trocas, vendas e doações para circular novas histórias.
                    </Text>
                </View>
            </View>

            <View style={styles.footerContainer}>
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('ObjectiveScreen')}
                >
                    <Text style={styles.buttonText}>Começar configuração rápida</Text>
                    <Feather name="arrow-right" size={20} color="#FFFFFF" /> 
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    Economia circular. Sustentável e inteligente.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    marginTop: 4,
  },
  // Ilustração Central
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  circleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E6EEF6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D1E3F3', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#43A047',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5F5F6',
  },
  // Conteúdo
  contentContainer: {
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4F4F4F',
    flex: 1,
    lineHeight: 20,
    textAlign: 'center', 
  },
  // Footer e Botões
  footerContainer: {
    width: '100%',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4, // Sombra no Android (Material Design)
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 8,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#828282',
    textAlign: 'center',
  },
});
