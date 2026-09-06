import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const COLORS = {
  primary: '#1E88E5',
  secondary: '#43A047',
  accent: '#FBC02D',
  background: '#F5F5F6',
  surface: '#FFFFFF',
  text: '#212121',
  subtitle: '#666666',
  border: '#E0E0E0',
  danger: '#E53935'
};

export default function WishlistScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wishlist');
      setItems(response.data || []);
    } catch (err) {
      console.log('Erro ao carregar wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!bookTitle.trim()) {
      Alert.alert('Atenção', 'Informe o título do livro desejado.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        book_title: bookTitle.trim(),
        author: author.trim() || null,
        genre: genre.trim() || null,
        max_price: maxPrice ? parseFloat(maxPrice) : null
      };

      const res = await api.post('/wishlist', payload);
      setItems(prev => [res.data, ...prev]);
      setModalVisible(false);
      setBookTitle('');
      setAuthor('');
      setGenre('');
      setMaxPrice('');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível adicionar o item à lista de desejos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/wishlist/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível remover o item.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Icon name="bookmark-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.itemTitle}>{item.book_title}</Text>
          {item.author ? <Text style={styles.itemSubtitle}>Autor: {item.author}</Text> : null}
          {item.genre ? <Text style={styles.itemBadge}>{item.genre}</Text> : null}
          {item.max_price ? (
            <Text style={styles.priceTag}>Preço máx: R$ {Number(item.max_price).toFixed(2)}</Text>
          ) : (
            <Text style={styles.priceTagFlex}>Aceita Troca / Qualquer Preço</Text>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item.id)}>
          <Icon name="trash-can-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de Desejos (Wishlist)</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => setModalVisible(true)}>
          <Icon name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Intro Banner */}
      <View style={styles.introBanner}>
        <Icon name="lightbulb-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
        <Text style={styles.introText}>
          Adicione os livros que você está procurando! Notificaremos você assim que alguém na sua região cadastrá-los.
        </Text>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bookmark-remove-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>Sua wishlist está vazia</Text>
          <Text style={styles.emptySubtitle}>Cadastre títulos que você deseja encontrar na região.</Text>
          <TouchableOpacity style={styles.addMainBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addMainBtnText}>Adicionar Livro Desejado</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal para adicionar item */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Desejo de Leitura</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.subtitle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Título do Livro *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: O Senhor dos Anéis"
              value={bookTitle}
              onChangeText={setBookTitle}
            />

            <Text style={styles.label}>Autor (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: J.R.R. Tolkien"
              value={author}
              onChangeText={setAuthor}
            />

            <Text style={styles.label}>Gênero (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Fantasia, Ficção, Acadêmico"
              value={genre}
              onChangeText={setGenre}
            />

            <Text style={styles.label}>Valor Máximo em R$ (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 35.00 (Deixe em branco para troca/doação)"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAddItem}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar na Wishlist</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border
  },
  backBtn: {
    padding: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  addBtnHeader: {
    padding: 6
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderColor: '#BBDEFB',
    borderWidth: 1
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: '#0D47A1',
    lineHeight: 18
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.subtitle,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  addMainBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  addMainBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  cardInfo: {
    flex: 1
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  itemSubtitle: {
    fontSize: 13,
    color: COLORS.subtitle,
    marginTop: 2
  },
  itemBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: '#F0F7FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  priceTag: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: 6
  },
  priceTagFlex: {
    fontSize: 12,
    color: COLORS.subtitle,
    fontStyle: 'italic',
    marginTop: 6
  },
  deleteBtn: {
    padding: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
