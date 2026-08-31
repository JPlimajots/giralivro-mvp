import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api } from './src/services/api';

export default function App() {
  const [apiStatus, setApiStatus] = useState('Conectando...');

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await api.get('/');
        setApiStatus(response.data.message);
      } catch (error) {
        setApiStatus('Erro ao conectar no FastAPI');
      }
    }
    checkApi();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>GiraLivro MVP</Text>
        <Text style={styles.status}>Status do Backend: {apiStatus}</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066CC',
  },
});
