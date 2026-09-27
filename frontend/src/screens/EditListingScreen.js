import React, { useState, useEffect } from 'react';
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

export default function EditListingScreen({ navigation, route }) {
  const { listing } = route.params || {};

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');

  const [isTrade, setIsTrade] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [isDonation, setIsDonation] = useState(false);
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Excelente');
  
  const [updating, setUpdating] = useState(false);

  const CATEGORIES = [
    'Fantasia', 'Ficção Histórica', 'Terror', 'Humor', 'Literatura', 
    'Magia', 'Mistério e Detetive', 'Teatro', 'Poesia', 
    'Romance', 'Ficção Científica', 'Contos', 'Suspense', 
    'Jovem Adulto', 'Outros'
  ];

  // Preenche os campos assim que a tela abre com os dados que vieram do cartão
  useEffect(() => {
    if (listing) {
      const book = listing.books || {};
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setGenre(book.genre || '');
      setDescription(listing.observations || '');

      const tt = listing.transaction_type || '';
      setIsTrade(tt.includes('TROCA'));
      setIsSale(tt.includes('VENDA'));
      setIsDonation(tt. includes('DOACAO') || tt.includes('DOAÇÃO'));
      
      if (listing.price) setPrice(listing.price.toString());

      // Traduz o ENUM do banco (maiúsculas) de volta para o texto da interface
      const conditionMapReverse = {
        'NOVO': 'Novo',
        'EXCELENTE': 'Excelente',
        'COM_MARCAS': 'Com marcas'
      };
      setCondition(conditionMapReverse[listing.condition] || 'Excelente');
    }
  }, [listing]);

  const handleUpdate = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha o título e autor do livro.');
      return;
    }
    if (!genre) {
      Alert.alert('Campos Obrigatórios', 'Selecione o gênero principal do livro.');
      return;
    }
    if (!isTrade && !isSale && !isDonation) {
      Alert.alert('Modalidade', 'Selecione ao menos uma modalidade (Troca, Venda ou Doação).');
      return;
    }

    let dbModality = 'TROCA'; 
    if (isDonation) {
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
      'Com marcas': 'COM_MARCAS' 
    };
    const dbCondition = conditionMap[condition];

    setUpdating(true);
    try {
      // 1. Atualiza os dados do livro
      if (listing.book_id) {
        const { error: bookErr } = await supabase
          .from('books')
          .update({
            title: title.trim(),
            author: author.trim(),
            genre: genre
          })
          .eq('id', listing.book_id);
        if (bookErr) throw bookErr;
      }

      // 2. Atualiza os dados do anúncio
      const { error: listingErr } = await supabase
        .from('listings')
        .update({
          transaction_type: dbModality,
          condition: dbCondition,
          price: isSale && price ? parseFloat(price) : null,
          observations: description
        })
        .eq('id', listing.id);
      if (listingErr) throw listingErr;

      Alert.alert('Sucesso', 'Anúncio atualizado!');
      navigation.goBack(); // Volta para a estante virtual
    } catch (err) {
      console.log('Update error:', err);
      Alert.alert('Erro ao Atualizar', 'Não foi possível salvar as alterações.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Anúncio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Título da Obra *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Autor(a) *</Text>
        <TextInput
          style={styles.input}
          value={author}
          onChangeText={setAuthor}
        />

        <Text style={styles.sectionHeader}>Gênero Principal *</Text>
        <View style={styles.genreContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.genreChip, genre === cat && styles.genreChipActive]}
              onPress={() => setGenre(cat)}
            >
              <Text style={[styles.genreChipText, genre === cat && styles.genreChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <TouchableOpacity
          style={[styles.primaryButton, updating && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={updating}
          activeOpacity={0.8}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#333' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 14, height: 48, fontFamily: 'Inter_400Regular', fontSize: 15 },
  sectionHeader: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#333', marginTop: 20, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10 },
  switchLabel: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#333' },
  conditionRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  conditionChip: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  conditionChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  conditionChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#666' },
  conditionChipTextActive: { color: '#FFF' },
  primaryButton: { backgroundColor: '#1E88E5', height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#90CAF9' },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  genreChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  genreChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  genreChipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#666' },
  genreChipTextActive: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});
