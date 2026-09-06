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
import FilterBottomSheet from './FilterBottomSheet';

export default function SearchScreen({ navigation }) {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    genre: 'todos',
    modality: 'todas',
    maxDistance: 10,
  });

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: {
          q: queryText || undefined,
          genre: appliedFilters.genre !== 'todos' ? appliedFilters.genre : undefined,
          modality: appliedFilters.modality !== 'todas' ? appliedFilters.modality : undefined,
          max_distance: appliedFilters.maxDistance,
        },
      });
      setResults(response.data);
    } catch (error) {
      console.log('Search error:', error);
      setResults([
        {
          id: 's1',
          title: 'O Hobbit',
          author: 'J.R.R. Tolkien',
          cover: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
          modality: 'TROCA',
          condition: 'Excelente',
          neighborhood: 'Boa Viagem',
          distance_km: 1.2,
          genre: 'Fantasia',
        },
        {
          id: 's2',
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
    performSearch();
  }, [appliedFilters]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com Busca e Filtros */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por obra, autor, ISBN..."
            placeholderTextColor="#9E9E9E"
            value={queryText}
            onChangeText={setQueryText}
            onSubmitEditing={performSearch}
          />
        </View>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
          <Feather name="sliders" size={20} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsCountText}>
            {results.length} resultado(s) encontrado(s)
          </Text>
          <Text style={styles.locationTag}>📍 Boa Viagem</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.resultsList}>
            {results.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={styles.bookCard}
                onPress={() => navigation.navigate('BookDetails', { book })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="cover" />

                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                  <Text style={styles.bookLoc}>{book.neighborhood} • Aprox. {book.distance_km}km</Text>

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
              </TouchableOpacity>
            ))}

            {results.length === 0 && (
              <Text style={styles.emptyText}>Nenhum livro encontrado para essa busca.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal BottomSheet de Filtros */}
      <FilterBottomSheet
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={appliedFilters}
        onApply={(newFilters) => setAppliedFilters(newFilters)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333',
  },
  filterBtn: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCountText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#666',
  },
  locationTag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#1E88E5',
  },
  resultsList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bookCover: {
    width: 65,
    height: 90,
    borderRadius: 6,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 2,
  },
  bookLoc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 6,
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
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
    marginVertical: 24,
  },
});
