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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function MyVirtualShelfScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings/me');
      setListings(response.data);
    } catch (error) {
      console.log('Error fetching my listings:', error);
      setListings([
        {
          id: 'list-1',
          title: 'O Hobbit',
          author: 'J.R.R. Tolkien',
          cover_url: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
          modality: 'VENDA OU TROCA',
          price: 80.0,
          condition: 'Novo',
          genre: 'Fantasia',
          status: 'Publicado',
          neighborhood: 'Boa Viagem',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleMarkAsTraded = async (id) => {
    try {
      await api.put(`/listings/${id}`, { status: 'Negociado' });
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
            await api.delete(`/listings/${id}`);
            Alert.alert('Removido', 'Anúncio excluído com sucesso!');
            fetchMyListings();
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeLogado')}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sua Estante Virtual</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddBookPhoto')}>
          <Feather name="plus-circle" size={24} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Seus Anúncios Ativos</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.listingsList}>
            {listings.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.cover_url }} style={styles.cover} resizeMode="cover" />

                <View style={styles.cardBody}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.status || 'Publicado'}</Text>
                  </View>

                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.bookAuthor}>{item.author}</Text>

                  <Text style={styles.modalityText}>
                    {item.modality} {item.price ? `• R$ ${item.price.toFixed(2)}` : ''}
                  </Text>
                  <Text style={styles.locationText}>📍 {item.neighborhood || 'Boa Viagem'}</Text>

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
                      <Feather name="trash-2" size={16} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

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

        {/* Impacto Positivo */}
        <View style={styles.impactBox}>
          <Text style={styles.impactHeader}>Seu impacto positivo</Text>
          <View style={styles.impactMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>1 livro</Text>
              <Text style={styles.metricTxt}>LIVROS REUTILIZADOS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>~2kg</Text>
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
    color: '#333',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 16,
  },
  listingsList: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cover: {
    width: 75,
    height: 105,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#E0E0E0',
  },
  cardBody: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#43A047',
  },
  bookTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#333',
  },
  bookAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  modalityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
    marginBottom: 2,
  },
  locationText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnSecondary: {
    backgroundColor: '#F5F5F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnSecondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
  },
  actionBtnDanger: {
    padding: 6,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
    marginVertical: 20,
  },
  incentiveCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  incentiveTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#1E88E5',
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
    backgroundColor: '#1E88E5',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  impactHeader: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#333',
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
    color: '#43A047',
  },
  metricTxt: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
});
