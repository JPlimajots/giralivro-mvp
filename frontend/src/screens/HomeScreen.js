import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHomeFeed = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feed/home');
      setFeed(response.data);
    } catch (error) {
      console.log('Error fetching home feed:', error);
      setFeed({
        recommended: [
          {
            id: 'h1',
            title: 'Neon Echo',
            author: 'Eliza Reed',
            cover_url: 'https://covers.openlibrary.org/b/id/8231856-M.jpg',
            modality: 'TROCA',
            condition: 'Excelente',
            neighborhood: 'Boa Viagem',
            distance_km: 0.8,
            genre: 'Sci-Fi',
          },
          {
            id: 'h2',
            title: 'Throne of Shadows',
            author: 'Elyon B. Drake',
            cover_url: 'https://covers.openlibrary.org/b/id/10454955-M.jpg',
            modality: 'VENDA',
            price: 45.0,
            condition: 'Novo',
            neighborhood: 'Boa Viagem',
            distance_km: 1.2,
            genre: 'Fantasia',
          },
        ],
        wishlist_matches: [
          {
            id: 'w1',
            title: 'The Eternal Garden',
            author: 'Eleanor Vance',
            cover_url: 'https://covers.openlibrary.org/b/id/153253-M.jpg',
            modality: 'TROCA',
            condition: 'Novo',
            neighborhood: 'Boa Viagem',
            distance_km: 0.4,
            genre: 'Ficção',
          },
        ],
        highlights: [
          {
            id: 'hl1',
            title: 'Night Lights',
            author: 'Clara Thorne',
            cover_url: 'https://covers.openlibrary.org/b/id/9255566-M.jpg',
            modality: 'VENDA',
            price: 30.0,
            condition: 'Bom',
            neighborhood: 'Pina',
            distance_km: 1.5,
            genre: 'Romance',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeFeed();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Logado */}
      <View style={styles.header}>
        <View style={styles.headerUser}>
          <Text style={styles.greetingEyebrow}>OLÁ, CAMILA!</Text>
          <Text style={styles.locationSub}>📍 Buscando perto de Boa Viagem</Text>
        </View>

        <View style={styles.headerIconsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
            <Feather name="search" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <Feather name="user" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 32 }} />
        ) : (
          <>
            {/* Carousel Recomendados */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recomendados para você</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselRow}>
              {feed?.recommended?.map((book) => (
                <View key={book.id} style={styles.carouselCard}>
                  <Image source={{ uri: book.cover_url }} style={styles.cardCover} resizeMode="cover" />
                  <View style={styles.cardBadges}>
                    <Text style={styles.cardModality}>{book.modality}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.cardAuthor}>{book.author}</Text>
                  <TouchableOpacity
                    style={styles.cardBtn}
                    onPress={() => navigation.navigate('BookDetails', { book })}
                  >
                    <Text style={styles.cardBtnText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Match com Wishlist */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Match com sua Wishlist</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Wishlist')}>
                <Text style={styles.seeAllText}>Ver Wishlist</Text>
              </TouchableOpacity>
            </View>

            {feed?.wishlist_matches?.map((item) => (
              <View key={item.id} style={styles.wishlistMatchCard}>
                <Image source={{ uri: item.cover_url }} style={styles.wishlistCover} resizeMode="cover" />
                <View style={styles.wishlistBody}>
                  <Text style={styles.wishlistTitle}>{item.title}</Text>
                  <Text style={styles.wishlistAuthor}>{item.author}</Text>
                  <Text style={styles.wishlistLoc}>📍 Boa Viagem ({item.distance_km}km)</Text>
                  <TouchableOpacity
                    style={styles.negotiateBtn}
                    onPress={() => navigation.navigate('BookDetails', { book: item })}
                  >
                    <Text style={styles.negotiateBtnText}>Negociar Agora</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Destaques na sua região */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Destaques na sua região</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselRow}>
              {feed?.highlights?.map((book) => (
                <View key={book.id} style={styles.highlightCard}>
                  <Image source={{ uri: book.cover_url }} style={styles.highlightCover} resizeMode="cover" />
                  <Text style={styles.cardTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.cardAuthor}>A {book.distance_km}km de distância</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      {/* Bottom Bar de Navegação */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTabActive}>
          <Feather name="home" size={20} color="#1E88E5" />
          <Text style={styles.bottomTabActiveText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Search')}>
          <Feather name="search" size={20} color="#9E9E9E" />
          <Text style={styles.bottomTabText}>Buscar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTabFab} onPress={() => navigation.navigate('AddBookPhoto')}>
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Wishlist')}>
          <Feather name="heart" size={20} color="#9E9E9E" />
          <Text style={styles.bottomTabText}>Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab} onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={20} color="#9E9E9E" />
          <Text style={styles.bottomTabText}>Perfil</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greetingEyebrow: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#1E88E5',
  },
  locationSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  headerIconsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#333',
  },
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1E88E5',
  },
  carouselRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  carouselCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardCover: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardBadges: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  cardModality: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#1E88E5',
  },
  cardTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#333',
  },
  cardAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cardBtn: {
    backgroundColor: '#F5F5F6',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
  },
  wishlistMatchCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: 12,
  },
  wishlistCover: {
    width: 65,
    height: 90,
    borderRadius: 6,
    marginRight: 14,
  },
  wishlistBody: {
    flex: 1,
  },
  wishlistTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#E65100',
  },
  wishlistAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#BF360C',
  },
  wishlistLoc: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#E65100',
    marginTop: 2,
    marginBottom: 8,
  },
  negotiateBtn: {
    backgroundColor: '#EF6C00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  negotiateBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFF',
  },
  highlightCard: {
    width: 120,
    marginRight: 12,
  },
  highlightCover: {
    width: 120,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
  },
  bottomTab: {
    alignItems: 'center',
  },
  bottomTabText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  bottomTabActive: {
    alignItems: 'center',
  },
  bottomTabActiveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#1E88E5',
    marginTop: 2,
  },
  bottomTabFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
});
