import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function AddListingDetailsScreen({ navigation, route }) {
  const { coverUrl = 'https://covers.openlibrary.org/b/id/153253-M.jpg' } = route.params || {};

  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Ficção');
  const [searchingIsbn, setSearchingIsbn] = useState(false);

  // Modalidade Switches
  const [isTrade, setIsTrade] = useState(true);
  const [isSale, setIsSale] = useState(false);
  const [isDonation, setIsDonation] = useState(false);
  const [price, setPrice] = useState('');

  // Conservação
  const [condition, setCondition] = useState('Excelente');
  const [publishing, setPublishing] = useState(false);

  const handleLookupIsbn = async () => {
    if (!isbn.trim()) {
      Alert.alert('Atenção', 'Digite o número do ISBN.');
      return;
    }

    setSearchingIsbn(true);
    try {
      const cleanIsbn = isbn.replace(/\D/g, '');
      
      // NOVA API: Open Library (Sem limites de cota e sem necessidade de chaves)
      const res = await fetch(`https://openlibrary.org/search.json?q=${cleanIsbn}`);
      const data = await res.json();
      
      if (data.docs && data.docs.length > 0) {
        // A Open Library retorna os resultados dentro de 'docs'
        const bookData = data.docs[0];
        const fetchedTitle = bookData.title || '';
        const fetchedAuthor = bookData.author_name ? bookData.author_name.join(', ') : '';
        
        setTitle(fetchedTitle);
        setAuthor(fetchedAuthor);
        
        Alert.alert('Obra Encontrada!', `Preenchemos automaticamente: "${fetchedTitle}" por ${fetchedAuthor}`);
      } else {
        Alert.alert('ISBN não encontrado', 'Não encontramos este ISBN na base pública. Preencha o título e autor manualmente.');
      }
    } catch (err) {
      Alert.alert('Erro de Conexão', 'Não foi possível buscar os metadados do ISBN. Preencha manualmente.');
    } finally {
      setSearchingIsbn(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha o título e autor do livro.');
      return;
    }

    if (!isTrade && !isSale && !isDonation) {
      Alert.alert('Modalidade', 'Selecione ao menos uma modalidade (Troca, Venda ou Doação).');
      return;
    }

    // Traduz as combinações dos switches estritamente para os ENUMs do banco
    let dbModality = 'TROCA'; 
    if (isDonation) {
      // Doação geralmente anula a venda, então tem prioridade máxima
      dbModality = 'DOACAO';
    } else if (isSale && isTrade) {
      dbModality = 'VENDA OU TROCA';
    } else if (isSale) {
      dbModality = 'VENDA';
    } else if (isTrade) {
      dbModality = 'TROCA';
    }

    const conditionMap = {
      'Novo': 'NOVO',
      'Excelente': 'EXCELENTE',
      'Com marcas': 'COM_MARCAS' // Caso tenha criado no banco como 'USADO', mude aqui.
    };
    const dbCondition = conditionMap[condition];

    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // 1. Procurar ou inserir livro na tabela `books`
      let bookId = null;
      if (isbn.trim()) {
        const { data: existingBook } = await supabase
          .from('books')
          .select('id')
          .eq('isbn', isbn.trim())
          .maybeSingle();
        if (existingBook) bookId = existingBook.id;
      }

      if (!bookId) {
        const { data: newBook, error: bookErr } = await supabase
          .from('books')
          .insert({
            isbn: isbn.trim() || null,
            title: title.trim(),
            author: author.trim(),
            cover_image_url: coverUrl,
          })
          .select()
          .single();

        if (bookErr) throw bookErr;
        bookId = newBook.id;
      }

      // 2. Inserir anúncio na tabela `listings`
      const { error: listingErr } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          book_id: bookId,
          transaction_type: dbModality,
          condition: dbCondition,
          price: isSale && price ? parseFloat(price) : null,
          observations: description,
          status: 'ATIVO',
        });

      if (listingErr) throw listingErr;

      navigation.reset({
        index: 0,
        routes: [{ name: 'PublishSuccess' }],
      });
    } catch (err) {
      console.log('Publish error:', err);
      Alert.alert('Erro ao Publicar', err.message || 'Não foi possível salvar o anúncio.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Anúncio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ISBN Auto-fill */}
        <Text style={styles.label}>Buscar metadados por ISBN (Open Library)</Text>
        <View style={styles.isbnRow}>
          <TextInput
            style={styles.isbnInput}
            placeholder="Ex: 9780451524935"
            placeholderTextColor="#9E9E9E"
            value={isbn}
            onChangeText={setIsbn}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.isbnButton} onPress={handleLookupIsbn} disabled={searchingIsbn}>
            {searchingIsbn ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.isbnButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Text style={styles.label}>Título da Obra *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Dom Casmurro"
          placeholderTextColor="#9E9E9E"
          value={title}
          onChangeText={setTitle}
        />

        {/* Autor */}
        <Text style={styles.label}>Autor(a) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Machado de Assis"
          placeholderTextColor="#9E9E9E"
          value={author}
          onChangeText={setAuthor}
        />

        {/* Modalidades (Switches) */}
        <Text style={styles.sectionHeader}>Modalidades de Negociação</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Disponível para Troca</Text>
          <Switch value={isTrade} onValueChange={setIsTrade} trackColor={{ true: '#1E88E5' }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Disponível para Venda</Text>
          <Switch value={isSale} onValueChange={setIsSale} trackColor={{ true: '#1E88E5' }} />
        </View>

        {isSale && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Preço de Venda (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 45.00"
              placeholderTextColor="#9E9E9E"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Disponível para Doação</Text>
          <Switch value={isDonation} onValueChange={setIsDonation} trackColor={{ true: '#43A047' }} />
        </View>

        {/* Estado de Conservação */}
        <Text style={styles.sectionHeader}>Estado de Conservação</Text>
        <View style={styles.conditionRow}>
          {['Novo', 'Excelente', 'Com marcas'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.conditionChipText, condition === c && styles.conditionChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão Publicar */}
        <TouchableOpacity
          style={[styles.primaryButton, publishing && styles.buttonDisabled]}
          onPress={handlePublish}
          disabled={publishing}
          activeOpacity={0.8}
        >
          {publishing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Publicar Anúncio</Text>
          )}
        </TouchableOpacity>
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
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  isbnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  isbnInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  isbnButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  isbnButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
    fontSize: 14,
  },
  sectionHeader: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  switchLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#333',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  conditionChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  conditionChipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  conditionChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#666',
  },
  conditionChipTextActive: {
    color: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#43A047',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
