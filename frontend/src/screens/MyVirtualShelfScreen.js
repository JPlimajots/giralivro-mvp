import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { COLORS } from '../constants/theme';

export default function MyVirtualShelfScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DISPONIVEIS'); // 'DISPONIVEIS', 'RESERVADOS', 'HISTORICO'
  const isFocused = useIsFocused(); 

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*, books(id, title, author, cover_image_url, genre)') 
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.log('Error fetching my listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchMyListings();
    }
  }, [isFocused]);

  // Filtragem conforme a aba selecionada (US-08)
  const filteredListings = listings.filter((item) => {
    const st = (item.status || 'Disponível').toUpperCase();
    if (activeTab === 'DISPONIVEIS') {
      return st === 'DISPONÍVEL' || st === 'DISPONIVEL' || st === 'ATIVO' || st === 'PUBLICADO';
    }
    if (activeTab === 'RESERVADOS') {
      return st === 'RESERVADO';
    }
    if (activeTab === 'HISTORICO') {
      return st === 'TROCADO' || st === 'VENDIDO' || st === 'DOADO' || st === 'NEGOCIADO';
    }
    return true;
  });

  const handleMarkAsTraded = async (id) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'NEGOCIADO', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      Alert.alert('Sucesso', 'Anúncio marcado como Negociado!');
      fetchMyListings();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status do anúncio.');
    }
  };

  const handleDeleteListing = async (id) => {
    Alert.alert('Excluir Anúncio', 'Deseja realmente remover este anúncio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('listings')
              .delete()
              .eq('id', id);
            if (error) throw error;
            Alert.alert('Removido', 'Anúncio excluído com sucesso!');
            fetchMyListings();
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
          }
        },
      },
    ]);
  };

  const count = listings.length;
  const paperKg = (count * 0.4).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeLogado')}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sua Estante Virtual</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddBookPhoto')}>
          <Feather name="plus-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Abas de Status da Release 2 (US-08) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DISPONIVEIS' && styles.tabItemActive]}
          onPress={() => setActiveTab('DISPONIVEIS')}
          accessibilityLabel="Aba de livros disponíveis"
        >
          <Text style={[styles.tabText, activeTab === 'DISPONIVEIS' && styles.tabTextActive]}>
            Disponíveis ({listings.filter(i => {
              const s = (i.status || '').toUpperCase();
              return s === 'DISPONÍVEL' || s === 'DISPONIVEL' || s === 'ATIVO' || s === 'PUBLICADO' || !i.status;
            }).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'RESERVADOS' && styles.tabItemActive]}
          onPress={() => setActiveTab('RESERVADOS')}
          accessibilityLabel="Aba de livros reservados"
        >
          <Text style={[styles.tabText, activeTab === 'RESERVADOS' && styles.tabTextActive]}>
            Reservados ({listings.filter(i => (i.status || '').toUpperCase() === 'RESERVADO').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HISTORICO' && styles.tabItemActive]}
          onPress={() => setActiveTab('HISTORICO')}
          accessibilityLabel="Aba de histórico concluído"
        >
          <Text style={[styles.tabText, activeTab === 'HISTORICO' && styles.tabTextActive]}>
            Histórico ({listings.filter(i => {
              const s = (i.status || '').toUpperCase();
              return s === 'TROCADO' || s === 'VENDIDO' || s === 'DOADO' || s === 'NEGOCIADO';
            }).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>Nenhum exemplar nesta aba</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'DISPONIVEIS' 
                ? 'Você não possui livros ativos anunciados no momento.' 
                : activeTab === 'RESERVADOS' 
                  ? 'Você não tem nenhum exemplar reservado no momento.' 
                  : 'Nenhuma negociação concluída no histórico ainda.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listingsList}>
            {filteredListings.map((item) => {
              const book = item.books || {};
              const title = book.title || item.title || 'Sem título';
              const author = book.author || item.author || '';
              const cover = book.cover_image_url || item.cover_url;
              const formattedModality = `${item.transaction_type || 'DISPONÍVEL'}${item.price ? ` • R$ ${Number(item.price).toFixed(2)}` : ''}`;

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card} 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('BookDetails', { listing: item })}
                >
                  {cover ? (
                    <Image source={{ uri: cover ? cover.split(',')[0] : '' }} style={styles.cover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cover, { backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }]}>
                      <Feather name="book" size={28} color="#1E88E5" />
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{item.status || 'ATIVO'}</Text>
                    </View>

                    <Text style={styles.bookTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.bookAuthor}>{author}</Text>

                    <Text style={styles.modalityText}>{formattedModality}</Text>

                    {/* Ações do Anúncio */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={(e) => { e.stopPropagation(); handleMarkAsTraded(item.id); }}
                      >
                        <Text style={styles.actionBtnSecondaryText}>Negociado</Text>
                      </TouchableOpacity>

                      {/* Agrupamento dos ícones alinhados à direita */}
                      <View style={styles.iconActions}>
                        <TouchableOpacity
                          style={styles.actionBtnIcon}
                          onPress={(e) => { 
                            e.stopPropagation(); 
                            navigation.navigate('EditListing', { listing: item }); 
                          }}
                        >
                          <Feather name="edit-2" size={18} color={COLORS.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnIcon}
                          onPress={(e) => { e.stopPropagation(); handleDeleteListing(item.id); }}
                        >
                          <Feather name="trash-2" size={18} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {listings.length === 0 && (
              <Text style={styles.emptyText}>Você ainda não possui livros cadastrados.</Text>
            )}
          </View>
        )}

        {/* Banner de Incentivo */}
        <View style={styles.incentiveCard}>
          <Text style={styles.incentiveTitle}>Tem mais livros parados?</Text>
          <Text style={styles.incentiveSub}>
            Ajude outros leitores e ganhe espaço em casa disponibilizando seus livros.
          </Text>
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => navigation.navigate('AddBookPhoto')}
            activeOpacity={0.8}
          >
            <Text style={styles.publishBtnText}>Publicar Outro Livro</Text>
          </TouchableOpacity>
        </View>

        {/* Impacto Positivo dinâmico */}
        <View style={styles.impactBox}>
          <Text style={styles.impactHeader}>Seu impacto positivo</Text>
          <View style={styles.impactMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{count} {count === 1 ? 'livro' : 'livros'}</Text>
              <Text style={styles.metricTxt}>LIVROS REUTILIZADOS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>~{paperKg}kg</Text>
              <Text style={styles.metricTxt}>PAPEL ECONOMIZADO</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#757575',
  },
  tabTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#424242',
    marginTop: 14,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 16,
  },
  listingsList: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: {
    width: 75,
    height: 105,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: COLORS.border,
  },
  cardBody: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: COLORS.secondary,
  },
  bookTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: COLORS.text,
  },
  bookAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.subtitle,
    marginBottom: 4,
  },
  modalityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnSecondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto', 
  },
  actionBtnIcon: {
    padding: 6,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: COLORS.disabled,
    marginVertical: 20,
  },
  incentiveCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  incentiveTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  incentiveSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4F4F4F',
    lineHeight: 20,
    marginBottom: 16,
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFF',
  },
  impactBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  impactHeader: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  impactMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: COLORS.secondary,
  },
  metricTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: COLORS.disabled,
    marginTop: 2,
  },
});
