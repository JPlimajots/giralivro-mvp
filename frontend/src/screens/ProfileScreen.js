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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { getAddressFromCep } from '../services/cep';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [locationName, setLocationName] = useState('');

  // Estados de edição
  const [editName, setEditName] = useState('');
  const [editCep, setEditCep] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editObjectives, setEditObjectives] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      // Ler dados do perfil na tabela profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Contar anúncios reais do usuário para métricas de impacto
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const realCount = listingsCount || 0;
      const zip = profileData?.zip_code || user.user_metadata?.cep || '';

      if (zip) {
        const addr = await getAddressFromCep(zip);
        if (addr?.formatted) {
          setLocationName(`${addr.formatted} (CEP ${zip})`);
        } else {
          setLocationName(`CEP ${zip}`);
        }
      } else {
        setLocationName('');
      }

      const userObjectives = profileData?.objectives || user.user_metadata?.objectives || [];

      const userProfile = {
        id: user.id,
        full_name: profileData?.full_name || user.user_metadata?.full_name || 'Usuário',
        email: profileData?.email || user.email,
        whatsapp: profileData?.whatsapp || '',
        zip_code: zip,
        objectives: Array.isArray(userObjectives) ? userObjectives : [],
        impact: {
          saved_books_count: realCount,
          paper_saved_kg: (realCount * 0.4).toFixed(1),
        },
      };

      setProfile(userProfile);
      setEditName(userProfile.full_name);
      setEditCep(userProfile.zip_code);
      setEditWhatsapp(userProfile.whatsapp);
      setEditObjectives(userProfile.objectives);
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const [editWhatsapp, setEditWhatsapp] = useState('');

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar em branco.');
      return;
    }

    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const cleanCep = editCep.trim();
      const cleanWa = editWhatsapp.trim();
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editName.trim(),
          zip_code: cleanCep,
          whatsapp: cleanWa,
          email: user.email,
          objectives: editObjectives,
        });
      if (error) throw error;

      if (cleanCep) {
        const addr = await getAddressFromCep(cleanCep);
        if (addr?.formatted) {
          setLocationName(`${addr.formatted} (CEP ${cleanCep})`);
        } else {
          setLocationName(`CEP ${cleanCep}`);
        }
      } else {
        setLocationName('');
      }

      setProfile(prev => ({
        ...prev,
        full_name: editName.trim(),
        zip_code: cleanCep,
        whatsapp: cleanWa,
        objectives: editObjectives,
      }));
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      // 1. Limpar token do AsyncStorage
      await AsyncStorage.removeItem('@giralivro:token');
      // 2. Encerrar sessão no Supabase
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Erro ao sair:', e);
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
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
  const impact = profile?.impact || { saved_books_count: 0, paper_saved_kg: '0.0' };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeLogado')}>
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
          {profile?.whatsapp ? (
            <Text style={[styles.userCep, { marginTop: 4 }]}>📱 WhatsApp: {profile.whatsapp}</Text>
          ) : null}
          {profile?.objectives && profile.objectives.length > 0 ? (
            <Text style={[styles.userCep, { marginTop: 4 }]}>
              🎯 Objetivos no app: {profile.objectives.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')}
            </Text>
          ) : null}
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            {locationName ? (
              <Text style={styles.userCep}>📍 Região: {locationName}</Text>
            ) : (
              <Text style={[styles.userCep, { color: '#BDBDBD', fontStyle: 'italic' }]}>
                📍 CEP não cadastrado — toque no ✏️ para adicionar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Card de Impacto GiraLivro */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <MaterialCommunityIcons name="leaf" size={24} color="#43A047" />
            <Text style={styles.impactTitle}>Seu Impacto GiraLivro</Text>
          </View>

          <Text style={styles.impactMessage}>
            Você já disponibilizou <Text style={styles.highlightText}>{impact.saved_books_count} {impact.saved_books_count === 1 ? 'livro' : 'livros'}</Text> na
            comunidade GiraLivro!
          </Text>

          <View style={styles.impactMetricsRow}>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>{impact.saved_books_count}</Text>
              <Text style={styles.metricLabel}>Livros reutilizados</Text>
            </View>
            <View style={styles.metricBadge}>
              <Text style={styles.metricNumber}>~{impact.paper_saved_kg}kg</Text>
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
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Edição de Perfil */}
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

            <Text style={styles.inputLabel}>WhatsApp para Contato (Opcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={editWhatsapp}
              onChangeText={setEditWhatsapp}
              placeholder="Ex: 81988887777"
              placeholderTextColor="#BDBDBD"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>CEP</Text>
            <TextInput
              style={styles.modalInput}
              value={editCep}
              onChangeText={setEditCep}
              placeholder="Digite seu CEP (ex: 51020-010)"
              placeholderTextColor="#BDBDBD"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Objetivos de Uso</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['comprar', 'vender', 'trocar', 'doar'].map(obj => {
                const isSelected = editObjectives.includes(obj);
                return (
                  <TouchableOpacity
                    key={obj}
                    onPress={() => {
                      if (isSelected) {
                        setEditObjectives(editObjectives.filter(o => o !== obj));
                      } else {
                        setEditObjectives([...editObjectives, obj]);
                      }
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isSelected ? '#1E88E5' : '#F5F5F6',
                      borderWidth: 1,
                      borderColor: isSelected ? '#1E88E5' : '#E0E0E0',
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: isSelected ? '#FFF' : '#333' }}>
                      {obj.charAt(0).toUpperCase() + obj.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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

      {/* Pop-up Modal de Confirmação de Logout */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Feather name="log-out" size={24} color="#D32F2F" />
              </View>
              <Text style={styles.modalTitle}>Sair da Conta</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
                Deseja realmente encerara sua sessão no GiraLivro?
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: '#D32F2F' }]}
                onPress={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Sair Agora</Text>
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
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
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
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 16,
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
    gap: 12,
    marginTop: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
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
