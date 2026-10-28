import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';
import { getOrCreateConversation } from '../services/chatService';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: '#1E88E5',
  secondary: '#43A047',
  accent: '#FBC02D',
  background: '#F5F5F6',
  surface: '#FFFFFF',
  text: '#212121',
  subtitle: '#666666',
  border: '#E0E0E0'
};

export default function BookDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const listing = route.params?.listing || route.params?.book;
  const [favorite, setFavorite] = useState(false);
  const [seller, setSeller] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [startingChat, setStartingChat] = useState(false);

  // Modal de Fotos em Tela Cheia
  const [modalVisible, setModalVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // Preço de referência da Amazon
  const [amazonPrice, setAmazonPrice] = useState(listing?.books?.amazon_price || listing?.amazon_price || null);
  const [amazonUrl, setAmazonUrl] = useState(listing?.books?.amazon_url || listing?.amazon_url || '');
  const [loadingAmazonPrice, setLoadingAmazonPrice] = useState(false);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (listing?.user_id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, whatsapp, zip_code')
            .eq('id', listing.user_id)
            .single();

          if (data) setSeller(data);
        } catch (e) {
          console.log('Error fetching seller info:', e);
        }
      }
    };
    fetchSellerInfo();
  }, [listing]);

  // Consulta preço da Amazon via Vercel caso o livro tenha ISBN e ainda não tenha o preço carregado
  useEffect(() => {
    const bookIsbn = listing?.books?.isbn || listing?.isbn;
    if (bookIsbn && !amazonPrice) {
      const fetchPrice = async () => {
        try {
          setLoadingAmazonPrice(true);
          const cleanIsbn = String(bookIsbn).replace(/\D/g, '');
          const visionEnv = process.env.EXPO_PUBLIC_VISION_API_URL;
          if (!visionEnv) return;
          const vercelBase = visionEnv.replace(/\/api\/avaliar-condicao$/, '');
          
          const res = await fetch(`${vercelBase}/api/preco-amazon?isbn=${cleanIsbn}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.amazon_price) {
              setAmazonPrice(data.amazon_price);
              setAmazonUrl(data.amazon_url || `https://www.amazon.com.br/dp/${cleanIsbn}`);
            }
          }
        } catch (e) {
          console.log('[BookDetails] Erro ao buscar preço Amazon:', e?.message || e);
        } finally {
          setLoadingAmazonPrice(false);
        }
      };
      fetchPrice();
    }
  }, [listing]);

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Anúncio não encontrado.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira este livro no GiraLivro: "${listing.title || listing.books?.title}" de ${listing.author || listing.books?.author}!`
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  const handleOpenWhatsapp = () => {
    const phone = seller?.whatsapp || listing.whatsapp;
    if (!phone) {
      Alert.alert(
        'WhatsApp Não Cadastrado',
        'O anunciante não cadastrou um número de WhatsApp. Você pode salvar a obra na sua Wishlist para demonstrar interesse.'
      );
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi seu anúncio no GiraLivro do livro "${listing.title || listing.books?.title}" e tenho interesse em negociar!`);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp no seu dispositivo.');
    });
  };

  const title = listing.title || listing.books?.title || 'Sem título';
  const author = listing.author || listing.books?.author || 'Autor não informado';
  const rawCover = listing.cover_image_url || listing.books?.cover_image_url || listing.cover || listing.cover_url || '';
  const images = rawCover.includes(',') ? rawCover.split(',') : (rawCover ? [rawCover] : []);
  const bookGenre = listing.books?.genre || listing.genre || 'Não especificado';
  const modality = listing.transaction_type || listing.modality || 'DISPONÍVEL';
  const condition = listing.condition || 'Excelente';
  const price = listing.price;
  const formattedPrice = (modality === 'DOACAO' || modality === 'DOAÇÃO')
    ? 'GRÁTIS (Doação)'
    : modality === 'TROCA'
      ? 'Disponível para Troca'
      : modality === 'VENDA OU TROCA'
        ? `R$ ${Number(price || 0).toFixed(2)} ou Troca`
        : price
          ? `R$ ${Number(price).toFixed(2)}`
          : 'Disponível';

  const handleStartChat = async () => {
    if (!currentUser) {
      Alert.alert('Login Necessário', 'Você precisa estar logado para conversar sobre este livro.', [
        { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }

    if (currentUser.id === listing.user_id) {
      Alert.alert('Atenção', 'Este anúncio é seu!');
      return;
    }

    setStartingChat(true);
    try {
      const conversa = await getOrCreateConversation(listing.id, listing.user_id);
      navigation.navigate('ChatConversation', { conversa, listing });
    } catch (err) {
      Alert.alert('Erro ao abrir chat', err.message || 'Não foi possível iniciar a conversa.');
    } finally {
      setStartingChat(false);
    }
  };

  const isOwner = currentUser?.id === listing?.user_id;
  const isAvailable = listing?.status === 'Disponível' || listing?.status === 'ATIVO' || !listing?.status;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carrossel de Imagens com Botões Flutuantes */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const slide = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActiveSlide(slide);
              }}
            >
              {images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    setFullscreenIndex(index);
                    setModalVisible(true);
                  }}
                  accessibilityLabel="Toque para ver a foto em tela cheia"
                >
                  <Image source={{ uri: img }} style={[styles.coverImage, { width: screenWidth }]} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.coverImage, { width: screenWidth, backgroundColor: '#1E88E5', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="book-open-page-variant" size={64} color="#FFF" />
            </View>
          )}

          {/* Indicadores do Carrossel (Bolinhas) */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeSlide && styles.dotActive]} />
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.floatBackBtn, { top: Math.max(insets.top, 16) + 10 }]} 
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar para a tela anterior"
            accessibilityRole="button"
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <View style={[styles.rightFloatContainer, { top: Math.max(insets.top, 16) + 10 }]}>
            <TouchableOpacity 
              style={styles.floatIconBtn} 
              onPress={() => setFavorite(!favorite)}
              accessibilityLabel={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
              accessibilityRole="button"
            >
              <Icon
                name={favorite ? "heart" : "heart-outline"}
                size={24}
                color={favorite ? "#E53935" : "#333"}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.floatIconBtn} 
              onPress={handleShare}
              accessibilityLabel="Compartilhar este anúncio"
              accessibilityRole="button"
            >
              <Icon name="share-variant" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.detailsSection}>
          <View style={styles.badgeRow}>
            <View style={[styles.modalityBadge, (modality === 'DOACAO' || modality === 'DOAÇÃO') ? styles.badgeGreen : styles.badgeBlue]}>
              <Text style={styles.modalityBadgeText}>{modality === 'DOACAO' ? 'DOAÇÃO' : modality}</Text>
            </View>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>{`Estado: ${condition}`}</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.author}>{`por ${author}`}</Text>

          {/* Bloco de Preço com Ancoragem de Desconto no estilo E-Commerce */}
          {amazonPrice && price && Number(price) > 0 ? (
            <View style={styles.offerCard}>
              <View style={styles.offerHeaderRow}>
                <View style={styles.offerLeftCol}>
                  <View style={styles.originalPriceRow}>
                    <Text style={styles.strikethroughPrice}>
                      Novo R$ {Number(amazonPrice).toFixed(2).replace('.', ',')}
                    </Text>
                    {Number(amazonPrice) > Number(price) && (
                      <View style={styles.discountPercentBadge}>
                        <Icon name="arrow-down-bold" size={12} color="#2E7D32" />
                        <Text style={styles.discountPercentText}>
                          {Math.round(((Number(amazonPrice) - Number(price)) / Number(amazonPrice)) * 100)}% OFF
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.mainPriceHighlight}>
                    R$ {Number(price).toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {Number(amazonPrice) > Number(price) && (
                  <View style={styles.savingsTagBox}>
                    <Text style={styles.savingsTagTitle}>VOCÊ ECONOMIZA</Text>
                    <Text style={styles.savingsTagAmount}>
                      R$ {(Number(amazonPrice) - Number(price)).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.amazonLinkBar}
                onPress={() => amazonUrl && Linking.openURL(amazonUrl)}
                activeOpacity={0.7}
                accessibilityLabel="Ver preço de referência na Amazon"
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="tag-outline" size={14} color="#616161" />
                  <Text style={styles.amazonLinkText}>Preço oficial do exemplar novo na Amazon</Text>
                </View>
                <Icon name="arrow-top-right" size={14} color="#757575" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 4 }}>
              <Text style={price ? styles.price : styles.freePrice}>{formattedPrice}</Text>
              
              {amazonPrice && (
                <View style={[styles.amazonLinkBar, { marginTop: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="tag-outline" size={14} color="#616161" />
                    <Text style={styles.amazonLinkText}>
                      Novo na Amazon: R$ {Number(amazonPrice).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => amazonUrl && Linking.openURL(amazonUrl)}>
                    <Text style={{ fontSize: 11, color: '#1E88E5', textDecorationLine: 'underline', fontFamily: 'Inter_600SemiBold' }}>
                      Conferir
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {loadingAmazonPrice && !amazonPrice && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 4 }}>
              <ActivityIndicator size="small" color="#212121" />
              <Text style={{ fontSize: 12, color: '#424242', fontFamily: 'Inter_500Medium' }}>
                Consultando preço de referência...
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Localização */}
          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Disponível na comunidade GiraLivro</Text>
          </View>

          {/* Gênero */}
          <View style={styles.infoRow}>
            <Icon name="book-open-variant" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>{bookGenre}</Text>
          </View>

          <View style={styles.divider} />

          {/* Descrição */}
          <Text style={styles.sectionTitle}>Descrição do Anúncio</Text>
          <Text style={styles.description}>
            {listing.observations || listing.description || 'Nenhuma observação adicional fornecida pelo anunciante.'}
          </Text>

          {/* Card do Anunciante */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Icon name="account" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{seller?.full_name || 'Leitor(a) GiraLivro'}</Text>
              <Text style={styles.sellerSubtitle}>
                {seller?.whatsapp ? `📱 WhatsApp: ${seller.whatsapp}` : 'Membro verificado'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Barra Inferior com Chat Interno (US-01) com altura adaptável */}
      {!isOwner && isAvailable && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity 
            style={styles.chatPrimaryBtn} 
            onPress={handleStartChat}
            disabled={startingChat}
            accessibilityLabel="Conversar no Chat"
          >
            {startingChat ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="chat-processing-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.chatButtonText}>Conversar no Chat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      {/* Modal Visualizador de Fotos em Tela Cheia */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalBackdrop} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
          
          {/* Header do Modal com Botão Fechar e Contador */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalActionBtn}
              onPress={() => setModalVisible(false)}
              accessibilityLabel="Fechar visualização"
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.modalPageIndicator}>
              {`${fullscreenIndex + 1} de ${images.length}`}
            </Text>

            {/* Espaçador para centralizar o título perfeitamente */}
            <View style={{ width: 44 }} />
          </View>

          {/* Carrossel em Tela Cheia */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: fullscreenIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setFullscreenIndex(idx);
            }}
            style={{ flex: 1 }}
          >
            {images.map((img, index) => (
              <View key={`full-${index}`} style={styles.fullscreenSlide}>
                <Image
                  source={{ uri: img }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Dica de Rodapé */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              Deslize para o lado para ver as fotos detalhadas do exemplar
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 140
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: COLORS.subtitle,
    marginBottom: 16
  },
  backBtnError: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  imageContainer: {
    width: '100%',
    height: 380,
    backgroundColor: '#1A1A1A',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  floatBackBtn: {
    position: 'absolute',
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  rightFloatContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
  },
  floatIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  detailsSection: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    elevation: 4
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  modalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8
  },
  badgeBlue: {
    backgroundColor: '#E3F2FD'
  },
  badgeGreen: {
    backgroundColor: '#E8F5E9'
  },
  modalityBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    color: COLORS.primary
  },
  conditionBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  conditionBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#616161'
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#212121',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  author: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#757575',
    marginTop: 4,
    marginBottom: 8
  },
  price: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#1B5E20'
  },
  freePrice: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#2E7D32'
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#424242',
    marginLeft: 10
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#212121',
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#616161',
    lineHeight: 22
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  sellerInfo: {
    flex: 1
  },
  sellerName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#212121'
  },
  sellerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#757575',
    marginTop: 2
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    elevation: 8
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerLeftCol: {
    flex: 1,
  },
  originalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  strikethroughPrice: {
    fontSize: 13,
    color: '#828282',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter_500Medium',
  },
  discountPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  discountPercentText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#2E7D32',
  },
  mainPriceHighlight: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: '#1B5E20',
    letterSpacing: -0.5,
  },
  savingsTagBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  savingsTagTitle: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  savingsTagAmount: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1B5E20',
    marginTop: 1,
  },
  amazonLinkBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  amazonLinkText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#616161',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  modalActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPageIndicator: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  fullscreenSlide: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalFooterText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
