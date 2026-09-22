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
import { supabase } from '../services/supabase';
import { COLORS } from '../constants/theme';

export default function MyVirtualShelfScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*, books(*)')
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
    fetchMyListings();
  }, []);

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Seus Anúncios Ativos</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.listingsList}>
            {listings.map((item) => {
              const book = item.books || {};
              const title = book.title || item.title || 'Sem título';
              const author = book.author || item.author || '';
              const cover = book.cover_image_url || item.cover_url;
              const formattedModality = `${item.transaction_type || 'DISPONÍVEL'}${item.price ? ` • R$ ${Number(item.price).toFixed(2)}` : ''}`;

              return (
                <View key={item.id} style={styles.card}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
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
                        onPress={() => handleMarkAsTraded(item.id)}
                      >
                        <Text style={styles.actionBtnSecondaryText}>Negociado</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDanger}
                        onPress={() => handleDeleteListing(item.id)}
                      >
                        <Feather name="trash-2" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  actionBtnDanger: {
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
