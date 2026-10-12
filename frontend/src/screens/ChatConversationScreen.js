import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { fetchMessages, sendMessage, blockUser, reportUser } from '../services/chatService';

export default function ChatConversationScreen({ navigation, route }) {
  const { conversa: initialConversa, listing: routeListing } = route.params || {};

  const [conversa, setConversa] = useState(initialConversa || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const flatListRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (initialConversa?.id) {
        await loadMessages(initialConversa.id);
        setupRealtime(initialConversa.id);
      } else {
        setLoading(false);
      }
    }
    init();

    return () => {
      // Limpeza da assinatura Realtime ao sair da tela para poupar conexões
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [initialConversa?.id]);

  const loadMessages = async (conversaId) => {
    try {
      setLoading(true);
      const data = await fetchMessages(conversaId);
      setMessages(data);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = (conversaId) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat_${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Evitar duplicações
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await sendMessage(conversa.id, textToSend);
      // Se realtime demorar, garante append local
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      Alert.alert('Erro ao enviar', err.message || 'Falha na entrega da mensagem.');
      setInputText(textToSend); // Restaura texto
    } finally {
      setSending(false);
    }
  };

  const handleBlock = () => {
    const otherUserId = currentUser?.id === conversa?.anunciante_id 
      ? conversa?.interessado_id 
      : conversa?.anunciante_id;

    Alert.alert(
      'Bloquear Usuário',
      'Tem certeza de que deseja bloquear este usuário? Vocês não poderão mais trocar mensagens.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(otherUserId);
              Alert.alert('Bloqueado', 'Usuário bloqueado com sucesso.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível bloquear o usuário.');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    const otherUserId = currentUser?.id === conversa?.anunciante_id 
      ? conversa?.interessado_id 
      : conversa?.anunciante_id;

    Alert.alert(
      'Denunciar Usuário',
      'Selecione o motivo da denúncia:',
      [
        { text: 'Comportamento inadequado', onPress: () => sendReport(otherUserId, 'Comportamento inadequado') },
        { text: 'Tentativa de golpe ou fraude', onPress: () => sendReport(otherUserId, 'Tentativa de fraude') },
        { text: 'Livro não correspondente', onPress: () => sendReport(otherUserId, 'Livro divergente') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const sendReport = async (userId, motivo) => {
    try {
      await reportUser(userId, conversa?.id, motivo);
      Alert.alert('Denúncia Enviada', 'Obrigado por ajudar a manter a comunidade segura.');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível registrar a denúncia.');
    }
  };

  // Metadados do anúncio para o Topo
  const listingData = conversa?.listings || routeListing;
  const bookData = listingData?.books;
  const bookTitle = bookData?.title || listingData?.title || 'Livro';
  const coverUrl = bookData?.cover_image_url ? bookData.cover_image_url.split(',')[0] : null;
  const modality = listingData?.transaction_type || 'DISPONÍVEL';

  return (
    <SafeAreaView style={styles.container}>
      {/* Topo / Header com Ações */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          accessibilityLabel="Voltar para a tela anterior"
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentUser?.id === conversa?.anunciante_id 
              ? conversa?.interessado?.full_name || 'Interessado' 
              : conversa?.anunciante?.full_name || 'Anunciante'}
          </Text>
          <Text style={styles.headerSubtitle}>No GiraLivro</Text>
        </View>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={handleReport}
          accessibilityLabel="Denunciar este usuário"
        >
          <Feather name="flag" size={18} color="#D32F2F" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={handleBlock}
          accessibilityLabel="Bloquear este usuário"
        >
          <Feather name="slash" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Cartão de Resumo do Livro no Topo da Conversa */}
      <View style={styles.bookSummaryCard}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.bookCover} resizeMode="cover" />
        ) : (
          <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
            <Feather name="book" size={20} color="#1E88E5" />
          </View>
        )}
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{bookTitle}</Text>
          <Text style={styles.bookModality}>{modality}</Text>
        </View>
      </View>

      {/* Lista de Mensagens */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMine = item.remetente_id === currentUser?.id;
              const time = item.created_at 
                ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
                  <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
                      {item.conteudo}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.otherMessageTime]}>
                        {time}
                      </Text>
                      {isMine && (
                        <Feather 
                          name={item.status_leitura === 'LIDA' ? 'check-circle' : 'check'} 
                          size={12} 
                          color={item.status_leitura === 'LIDA' ? '#4CAF50' : 'rgba(255,255,255,0.7)'} 
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="message-square" size={40} color="#BDBDBD" />
                <Text style={styles.emptyText}>Inicie uma conversa combinando a troca ou doação!</Text>
              </View>
            }
          />
        )}

        {/* Barra de Entrada de Texto */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Digite uma mensagem (máx 1.000)..."
            placeholderTextColor="#9E9E9E"
            value={inputText}
            onChangeText={setInputText}
            maxLength={1000}
            multiline
            accessibilityLabel="Campo de texto para mensagem"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            accessibilityLabel="Enviar mensagem"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#212121',
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#757575',
  },
  menuButton: {
    padding: 8,
    marginLeft: 6,
  },
  bookSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bookCover: {
    width: 38,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#EEE',
  },
  bookCoverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  bookInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bookTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#212121',
  },
  bookModality: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#1E88E5',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#1E88E5',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#212121',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#9E9E9E',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: 'Inter_400Regular',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#212121',
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
});
