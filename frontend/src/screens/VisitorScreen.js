import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function VisitorScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [interests, setInterests] = useState([]);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'ficcao', label: 'Ficção' },
    { id: 'romance', label: 'Romance' },
    { id: 'fantasia', label: 'Fantasia' },
  ];

  // Dados de exemplo — substituir por uma chamada à API do backend (ex: GET /livros/vitrine)
  const books = [
    {
      id: '1',
      title: '1984',
      author: 'George Orwell',
      year: 1949,
      category: 'ficcao',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg',
      available: true,
    },
    {
      id: '2',
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      year: 1899,
      category: 'romance',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9788535914785-M.jpg',
      available: true,
    },
  ];

  const filteredBooks = books.filter((book) => {
    const matchesFilter = selectedFilter === 'todos' || book.category === selectedFilter;
    const term = searchText.trim().toLowerCase();
    const matchesSearch =
      !term ||
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const handleToggleInterest = (id) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((item) => item !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const isButtonEnabled = interests.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com Voltar e Progresso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressInactive} />
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
        </View>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>VITRINE DO VISITANTE</Text>
        <Text style={styles.title}>O que você quer ler agora?</Text>
        <Text style={styles.subtitle}>
          Encontre sua próxima aventura. Busque pelo nome da obra, autor ou número do ISBN.
        </Text>

        {/* Busca */}
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

        {/* Filtros */}
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

        {/* Lista de Livros */}
        <View style={styles.booksList}>
          {filteredBooks.map((book) => {
            const isSelected = interests.includes(book.id);
            return (
              <View key={book.id} style={styles.bookCard}>
                <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />

                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor}>
                    {book.author} • {book.year}
                  </Text>

                  {book.available && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Disponível para troca</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.addButton, isSelected && styles.addButtonSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleToggleInterest(book.id)}
                >
                  <Feather name={isSelected ? 'check' : 'plus'} size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })}

          {filteredBooks.length === 0 && (
            <Text style={styles.emptyText}>Nenhum livro encontrado para essa busca.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Interesses selecionados</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{interests.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isButtonEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
          disabled={!isButtonEnabled}
           onPress={() => navigation.navigate('LocationInterest')}
        >
          <Text style={[styles.buttonText, isButtonEnabled ? styles.buttonTextEnabled : styles.buttonTextDisabled]}>
            Continuar
          </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressActive: {
    width: 24,
    height: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
    marginRight: 6,
  },
  progressInactive: {
    width: 6,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#9E9E9E',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4F4F4F',
    lineHeight: 22,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#333333',
    marginLeft: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#4F4F4F',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  booksList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bookCover: {
    width: 56,
    height: 76,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  bookTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#333333',
    marginBottom: 2,
  },
  bookAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#2E7D32',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonSelected: {
    backgroundColor: '#43A047',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#828282',
    textAlign: 'center',
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  footerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#333333',
  },
  counterBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  counterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1E88E5',
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#005BB5',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  buttonTextEnabled: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#9E9E9E',
  },
});
