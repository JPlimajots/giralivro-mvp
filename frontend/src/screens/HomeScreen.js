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
import { supabase } from '../services/supabase';
import { getAddressFromCep } from '../services/cep';

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [userName, setUserName] = useState('');
  const [locationText, setLocationText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // Pegar dados do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, zip_code')
          .eq('id', user.id)
          .single();

        const name = profile?.full_name || user.user_metadata?.full_name || 'Leitor(a)';
        const zip = profile?.zip_code || user.user_metadata?.cep || '';
        setUserName(name.split(' ')[0].toUpperCase());

        if (zip) {
          const addr = await getAddressFromCep(zip);
          if (addr?.formatted) {
            setLocationText(addr.formatted);
          } else {
            setLocationText(`CEP ${zip}`);
          }
        } else {
          setLocationText('');
        }
      }

      // Buscar anúncios ativos com dados dos livros
      const { data: listingsData, error } = await supabase
        .from('listings')
        .select('*, books(*)')
        .eq('status', 'ATIVO')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setListings(listingsData || []);
    } catch (error) {
      console.log('Error fetching home data:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Logado */}
      <View style={styles.header}>
        <View style={styles.headerUser}>
          <Text style={styles.greetingEyebrow}>OLÁ, {userName || 'LEITOR(A)'}!</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {locationText ? (
              <Text style={styles.locationSub}>📍 Buscando perto de {locationText}</Text>
            ) : (
              <Text style={[styles.locationSub, { color: '#828282', fontStyle: 'italic' }]}>
                📍 CEP não cadastrado — toque para adicionar
              </Text>
            )}
          </TouchableOpacity>
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
        ) : listings.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={64} color="#BDBDBD" />
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#666', marginTop: 16 }}>
              Nenhum livro disponível ainda
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9E9E9E', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
              Seja o primeiro a cadastrar um livro e iniciar a comunidade GiraLivro na sua região!
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#1E88E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 }}
              onPress={() => navigation.navigate('AddBookPhoto')}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF', fontSize: 15 }}>Cadastrar Meu Primeiro Livro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Livros Disponíveis */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Livros disponíveis</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselRow}>
              {listings.map((listing) => (
                <View key={listing.id} style={styles.carouselCard}>
                  {listing.books?.cover_image_url ? (
                    <Image source={{ uri: listing.books.cover_image_url }} style={styles.cardCover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardCover, { backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }]}>
                      <Feather name="book" size={32} color="#1E88E5" />
                    </View>
                  )}
                  <View style={styles.cardBadges}>
                    <Text style={styles.cardModality}>{listing.transaction_type}</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{listing.books?.title || 'Sem título'}</Text>
                  <Text style={styles.cardAuthor}>{listing.books?.author || ''}</Text>
                  {listing.price ? (
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#43A047', marginBottom: 4 }}>R$ {Number(listing.price).toFixed(2)}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.cardBtn}
                    onPress={() => navigation.navigate('BookDetails', { book: { ...listing.books, ...listing } })}
                  >
                    <Text style={styles.cardBtnText}>Ver Detalhes</Text>
                  </TouchableOpacity>
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
