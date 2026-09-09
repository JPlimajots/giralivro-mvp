import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Estados de edição
  const [editName, setEditName] = useState('');
  const [editCep, setEditCep] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      setEditName(response.data.full_name || '');
      setEditCep(response.data.cep || '');
    } catch (error) {
      console.log('Error fetching profile:', error);
      // Fallback para demonstração (Camila)
      const mockProfile = {
        id: 'user-mock-camila',
        full_name: 'Camila Silva',
        email: 'camila@giralivro.com.br',
        cep: '51020-010',
        favorite_genres: ['Ficção', 'Romance', 'Fantasia'],
        impact: {
          saved_amount: 240.0,
          saved_books_count: 3,
          paper_saved_kg: 2.0,
        },
      };
      setProfile(mockProfile);
      setEditName(mockProfile.full_name);
      setEditCep(mockProfile.cep);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar em branco.');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put('/users/me', {
        full_name: editName.trim(),
        cep: editCep.trim(),
      });
      setProfile(response.data);
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair da Conta', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@giralivro:token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Leitor(a)';
  const impact = profile?.impact || { saved_amount: 240.0, saved_books_count: 3 };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('VisitorScreen')}>
          <Feather name="home" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Feather name="edit-2" size={20} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner de Boas-Vindas */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.eyebrow}>BEM-VINDA(O) DE VOLTA</Text>
          <Text style={styles.userName}>Olá, {firstName}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <Text style={styles.userCep}>📍 Região de entrega: CEP {profile?.cep || 'Não informado'}</Text>
        </View>

        {/* Card de Impacto GiraLivro */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <MaterialCommunityIcons name="leaf" size={24} color="#43A047" />
            <Text style={styles.impactTitle}>Seu Impacto GiraLivro</Text>
          </View>

          <Text style={styles.impactMessage}>
            Você já economizou <Text style={styles.highlightText}>R$ {impact.saved_amount.toFixed(2)}</Text> e
            salvou <Text style={styles.highlightText}>{impact.saved_books_count} livros</Text> neste ano!
          </Text>

          <View style={styles.impactMetricsRow}>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>{impact.saved_books_count}</Text>
              <Text style={styles.metricLabel}>Livros reutilizados</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>~{impact.paper_saved_kg || 2}kg</Text>
              <Text style={styles.metricLabel}>Papel economizado</Text>
            </View>
          </View>
        </View>

        {/* Ações Rápidas */}
        <Text style={styles.sectionTitle}>Sua Estante Virtual</Text>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => navigation.navigate('MyVirtualShelf')}>
          <View style={styles.actionIconBg}>
            <Feather name="book-open" size={22} color="#1E88E5" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionCardTitle}>Gerenciar Minha Estante</Text>
            <Text style={styles.actionCardSub}>Veja e edite seus livros anunciados</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9E9E9E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => navigation.navigate('AddBookPhoto')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#E8F5E9' }]}>
            <Feather name="plus-circle" size={22} color="#43A047" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionCardTitle}>Cadastrar novos livros</Text>
            <Text style={styles.actionCardSub}>Adicione obras paradas na sua estante</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9E9E9E" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sua Wishlist</Text>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => navigation.navigate('Wishlist')}>
          <View style={[styles.actionIconBg, { backgroundColor: '#FFF3E0' }]}>
            <Feather name="heart" size={22} color="#F57C00" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionCardTitle}>Livros desejados</Text>
            <Text style={styles.actionCardSub}>Receba alertas quando alguém anunciar</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9E9E9E" />
        </TouchableOpacity>

        {/* Botão Sair da Conta */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Edição de Perfil (PUT /users/me) */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Dados do Perfil</Text>

            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
            />

            <Text style={styles.inputLabel}>CEP</Text>
            <TextInput
              style={styles.modalInput}
              value={editCep}
              onChangeText={setEditCep}
              placeholder="51020-010"
              keyboardType="numeric"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F6',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  userCep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4F4F4F',
  },
  impactCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  impactTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#2E7D32',
    marginLeft: 8,
  },
  impactMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#1B5E20',
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightText: {
    fontFamily: 'Inter_700Bold',
    color: '#2E7D32',
  },
  impactMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBadge: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  metricNumber: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#43A047',
  },
  metricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#333333',
  },
  actionCardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  logoutButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#D32F2F',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#4F4F4F',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  modalCancelText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#757575',
  },
  modalSaveButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
});
