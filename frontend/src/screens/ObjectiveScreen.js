import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaFrameContext, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function ObjectiveScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="#1E88E5" />
            </TouchableOpacity>

            <Text style={styles.title}>Qual é o seu objetivo principal?</Text>
            <Text style={styles.subtitle}>Tela em produção...</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F6', padding: 24 },
  backButton: { marginBottom: 24, marginTop: 10 },
  title: { fontSize: 24, fontFamily: 'Nunito_700Bold', color: '#333' },
  subtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#666', marginTop: 10 },
});

