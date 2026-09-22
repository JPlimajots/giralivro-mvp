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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../services/supabase';

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
  const listing = route.params?.listing || route.params?.book;
  const [favorite, setFavorite] = useState(false);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const fetchSellerInfo = async () => {
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
  const cover = listing.cover_image_url || listing.books?.cover_image_url || listing.cover || listing.cover_url;
  const modality = listing.transaction_type || listing.modality || 'DISPONÍVEL';
  const condition = listing.condition || 'Excelente';
  const price = listing.price;
  const formattedPrice = price ? `R$ ${Number(price).toFixed(2)}` : 'GRÁTIS (Doação)';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Imagem de Capa com Botões Flutuantes */}
        <View style={styles.imageContainer}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: '#1E88E5', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="book-open-page-variant" size={64} color="#FFF" />
            </View>
          )}
          <TouchableOpacity style={styles.floatBackBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.rightFloatContainer}>
            <TouchableOpacity style={styles.floatIconBtn} onPress={() => setFavorite(!favorite)}>
              <Icon
                name={favorite ? "heart" : "heart-outline"}
                size={24}
                color={favorite ? "#E53935" : "#333"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatIconBtn} onPress={handleShare}>
              <Icon name="share-variant" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.detailsSection}>
          <View style={styles.badgeRow}>
            <View style={[styles.modalityBadge, modality === 'DOAÇÃO' ? styles.badgeGreen : styles.badgeBlue]}>
              <Text style={styles.modalityBadgeText}>{modality}</Text>
            </View>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>{`Estado: ${condition}`}</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.author}>{`por ${author}`}</Text>

          <Text style={price ? styles.price : styles.freePrice}>{formattedPrice}</Text>

          <View style={styles.divider} />

          {/* Localização */}
          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Disponível na comunidade GiraLivro</Text>
          </View>

          {/* Gênero */}
          <View style={styles.infoRow}>
            <Icon name="book-open-variant" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>{`Gênero: ${listing.genre || 'Ficção / Literatura'}`}</Text>
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

      {/* Barra Inferior com Ação WhatsApp */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleOpenWhatsapp}>
          <Icon name="whatsapp" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.chatButtonText}>Conversar no WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 100
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
    height: 340,
    backgroundColor: '#000',
    position: 'relative'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95
  },
  floatBackBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },
  rightFloatContainer: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row'
  },
  floatIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 4
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
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary
  },
  conditionBadge: {
    backgroundColor: '#F5F5F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  conditionBadgeText: {
    fontSize: 12,
    color: COLORS.subtitle
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 28
  },
  author: {
    fontSize: 15,
    color: COLORS.subtitle,
    marginTop: 4,
    marginBottom: 12
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary
  },
  freePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.secondary
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    color: COLORS.subtitle,
    lineHeight: 22
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  sellerInfo: {
    flex: 1
  },
  sellerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text
  },
  sellerSubtitle: {
    fontSize: 12,
    color: COLORS.subtitle,
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
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
