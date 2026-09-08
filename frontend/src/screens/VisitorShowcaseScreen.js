import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Mock de dados simulando o retorno do bd
const MOCK_BOOKS = [
  {
    id: '1',
    title: '1984',
    author: 'George Orwell',
    year: '1949',
    cover: 'https://covers.openlibrary.org/b/id/153253-M.jpg',
    status: 'Disponível para troca'
  },
  {
    id: '2',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    year: '1899',
    cover: 'https://covers.openlibrary.org/b/id/10454955-M.jpg',
    status: 'Disponível para troca'
  },
  {
    id: '3',
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    year: '1937',
    cover: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
    status: 'Disponível para venda'
  }
];

const CATEGORIES = ['Todos', 'Ficção', 'Romance', 'Fantasia'];

export default function VisitorShowcaseScreen({ route, navigation }) {
    const { selectedObjectives = [] } = route.params || {};

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedBooks, setSlectedBooks] = useState([]);

    const toggleBook = (id) => {
        if (selectedBooks.includes(id)) {
            setSlectedBooks(selectedBooks.filter(bookId => bookId !== id));
        } else {
            setSlectedBooks([...selectedBooks, id]);
        }
    };

    const isButtonEnabled = selectedBooks.length > 0;

return (
    <SafeAreaView style={styles.container}>
      {/* Header com Voltar e Progresso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInactiveDot} />
          <View style={styles.progressActiveDash} />
          <View style={styles.progressInactiveDot} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.overline}>VITRINE DO VISITANTE</Text>
        <Text style={styles.title}>O que você quer ler agora?</Text>
        <Text style={styles.subtitle}>
          Encontre sua próxima aventura. Busque pelo nome da obra, autor ou número do ISBN.
        </Text>

        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pelo título, autor, ISBN..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Chips de Categoria */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.chip, selectedCategory === category && styles.chipSelected]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedCategory === category && styles.chipTextSelected]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ width: 24 }} /> {/* Espaçamento final */}
        </ScrollView>

        {/* Lista de Livros */}
        <View style={styles.listContainer}>
          {MOCK_BOOKS.map((book) => {
            const isSelected = selectedBooks.includes(book.id);
            return (
              <View key={book.id} style={styles.bookCard}>
                <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="cover" />
                
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author} • {book.year}</Text>
                  
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{book.status}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, isSelected && styles.actionButtonSelected]}
                  onPress={() => toggleBook(book.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                  ) : (
                    <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Fixo */}
      <View style={styles.footer}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>Interesses selecionados</Text>
          <View style={[styles.counterBadge, isButtonEnabled && styles.counterBadgeActive]}>
            <Text style={[styles.counterText, isButtonEnabled && styles.counterTextActive]}>
              {selectedBooks.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, isButtonEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
          disabled={!isButtonEnabled}
          // onPress={() => navigation.navigate('LocationScreen', { selectedObjectives, selectedBooks })} 
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
  // Barra de progresso exata da imagem (ponto, traço, ponto, ponto)
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressActiveDash: {
    width: 24,
    height: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressInactiveDot: {
    width: 6,
    height: 4,
    backgroundColor: '#D6D6D6',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  content: {
    flex: 1,
  },
  overline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#828282',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: '#333333',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4F4F4F',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 24,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333',
  },
  chipsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#005BB5',
    borderColor: '#005BB5',
  },
  chipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333333',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  bookAuthor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#2E7D32',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButtonSelected: {
    backgroundColor: '#43A047', // Verde Sustentável
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#333333',
  },
  counterBadge: {
    backgroundColor: '#E0E0E0',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadgeActive: {
    backgroundColor: '#1E88E5',
  },
  counterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#757575',
  },
  counterTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#1E88E5',
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
