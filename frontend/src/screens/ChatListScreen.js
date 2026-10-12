import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { fetchMyConversations } from '../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const isFocused = useIsFocused();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const data = await fetchMyConversations();
      setConversations(data);
    } catch (err) {
      console.error('Erro ao carregar lista de conversas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          accessibilityLabel="Voltar"
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Mensagens</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSeller = currentUser?.id === item.anunciante_id;
            const otherUser = isSeller ? item.interessado : item.anunciante;
            const otherName = otherUser?.full_name || 'Leitor do GiraLivro';

            const book = item.listings?.books;
            const bookTitle = book?.title || item.listings?.title || 'Livro';
            const coverUrl = book?.cover_image_url ? book.cover_image_url.split(',')[0] : null;

            // Última mensagem
            const msgs = item.mensagens || [];
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            const lastText = lastMsg ? lastMsg.conteudo : 'Conversa iniciada';
            const unreadCount = msgs.filter(m => m.remetente_id !== currentUser?.id && m.status_leitura !== 'LIDA').length;

            return (
              <TouchableOpacity
                style={styles.conversationCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ChatConversation', { conversa: item })}
                accessibilityLabel={`Conversa com ${otherName} sobre o livro ${bookTitle}`}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.bookThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.bookThumb, styles.bookThumbPlaceholder]}>
                    <Feather name="book" size={22} color="#1E88E5" />
                  </View>
                )}

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.userName} numberOfLines={1}>{otherName}</Text>
                    {lastMsg?.created_at && (
                      <Text style={styles.timeText}>
                        {new Date(lastMsg.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.bookTitleText} numberOfLines={1}>
                    Sobre: <Text style={{ color: '#1E88E5' }}>{bookTitle}</Text>
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.lastMessageText} numberOfLines={1}>
                      {lastText}
                    </Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={48} color="#BDBDBD" />
              <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptySubtitle}>
                Quando você demonstrar interesse em um livro ou receber mensagens sobre seus anúncios, elas aparecerão aqui.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#212121',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  bookThumb: {
    width: 48,
    height: 66,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  bookThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#212121',
    flex: 1,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  bookTitleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#616161',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#757575',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#424242',
    marginTop: 14,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
