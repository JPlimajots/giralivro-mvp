import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api } from '../services/api';

export default function VisitorScreen({ navigation, route }) {
  const { selectedGenres = [] } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'Ficção', label: 'Ficção' },
    { id: 'Romance', label: 'Romance' },
    { id: 'Fantasia', label: 'Fantasia' },
  ];

  const fetchPublicFeed = async () => {
    setLoading(true);
    try {
      const genresParam = selectedGenres.length > 0 ? selectedGenres.join(',') : undefined;
      const response = await api.get('/feed/public', {
        params: { genres: genresParam },
      });
      setBooks(response.data);
    } catch (error) {
      console.log('Error fetching public feed:', error);
      // Mock de segurança caso API esteja offline
      setBooks([
        {
          id: 'b1',
          title: '1984',
          author: 'George Orwell',
          cover: 'https://covers.openlibrary.org/b/id/153253-M.jpg',
          modality: 'TROCA',
          condition: 'Excelente',
          neighborhood: 'Boa Viagem',
          distance_km: 1.2,
          genre: 'Ficção',
        },
        {
          id: 'b2',
          title: 'O Hobbit',
          author: 'J.R.R. Tolkien',
          cover: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
          modality: 'TROCA',
          condition: 'Bom',
          neighborhood: 'Boa Viagem',
          distance_km: 1.5,
          genre: 'Fantasia',
        },
        {
          id: 'b3',
          title: 'Duna',
          author: 'Frank Herbert',
          cover: 'https://covers.openlibrary.org/b/id/10523450-M.jpg',
          modality: 'VENDA OU TROCA',
          price: 80.0,
          condition: 'Novo',
          neighborhood: 'Pina',
          distance_km: 2.5,
          genre: 'Sci-Fi',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicFeed();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesFilter =
      selectedFilter === 'todos' ||
      book.genre?.toLowerCase() === selectedFilter.toLowerCase();
    const term = searchText.trim().toLowerCase();
    const matchesSearch =
      !term ||
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>GiraLivro</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginHeaderBtn}>Entrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner de Barreira de Login (Conforme Protótipo pág. 14) */}
        <View style={styles.barrierBanner}>
          <View style={styles.barrierTextContainer}>
            <Text style={styles.barrierEyebrow}>VITRINE DE VISITANTE</Text>
            <Text style={styles.barrierTitle}>Descubra sua próxima história</Text>
            <Text style={styles.barrierLocation}>📍 Buscando perto de Boa Viagem</Text>
            <Text style={styles.barrierSubtitle}>
              Crie uma conta grátis para reservar livros, negociar e falar com outros leitores.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.barrierButton}
            onPress={() => navigation.navigate('SignUp', { onboardingGenres: selectedGenres })}
            activeOpacity={0.8}
          >
            <Text style={styles.barrierButtonText}>Criar conta agora</Text>
          </TouchableOpacity>
        </View>

        {/* Campo de Busca */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pelo título, autor, ISBN..."
            placeholderTextColor="#9E9E9E"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filtros por Categoria */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recomendados para você</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.booksList}>
            {filteredBooks.map((book) => (
              <View key={book.id} style={styles.bookCard}>
                <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="cover" />

                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                  <Text style={styles.bookLocation}>
                    {book.neighborhood} • {book.distance_km}km
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.modalityBadge}>
                      <Text style={styles.modalityText}>
                        {book.modality} {book.price ? `R$ ${book.price}` : ''}
                      </Text>
                    </View>
                    <View style={styles.conditionBadge}>
                      <Text style={styles.conditionText}>{book.condition}</Text>
                    </View>
                  </View>
                </View>

                {/* Botão Ver Detalhes (Aciona Login se não logado) */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
                </TouchableOpacity>
              </View>
            ))}

            {filteredBooks.length === 0 && (
              <Text style={styles.emptyText}>Nenhum livro encontrado para essa busca.</Text>
            )}
          </View>
        )}
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#1E88E5',
  },
  loginHeaderBtn: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1E88E5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  barrierBanner: {
    backgroundColor: '#1E88E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  barrierTextContainer: {
    marginBottom: 16,
  },
  barrierEyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#BBDEFB',
    letterSpacing: 1,
    marginBottom: 4,
  },
  barrierTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  barrierLocation: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#E3F2FD',
    marginBottom: 8,
  },
  barrierSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#F5F5F6',
    lineHeight: 20,
  },
  barrierButton: {
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barrierButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1E88E5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333333',
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  filterChipSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filterChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 14,
  },
  booksList: {
    gap: 14,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 85,
    borderRadius: 6,
    marginRight: 14,
    backgroundColor: '#E0E0E0',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  bookAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  bookLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalityBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  modalityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#1E88E5',
  },
  conditionBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  conditionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#43A047',
  },
  detailsButton: {
    backgroundColor: '#F5F5F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  detailsButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
    marginVertical: 20,
  },
});
