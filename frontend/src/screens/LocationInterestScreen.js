import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { fetchAddressByCep } from '../services/viacep';

export default function LocationInterestScreen({ navigation }) {
  const [cep, setCep] = useState('');
  const [addressInfo, setAddressInfo] = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const genres = [
    'Ficção',
    'Fantasia',
    'Romance',
    'Biografia',
    'Terror',
    'Mistério',
    'Sci-Fi',
  ];

  const handleCepChange = async (text) => {
    setCep(text);
    const clean = text.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      const info = await fetchAddressByCep(clean);
      if (info && !info.error) {
        setAddressInfo(info);
      } else {
        setAddressInfo(null);
      }
      setLoadingCep(false);
    } else {
      setAddressInfo(null);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingCep(true);
    // Simula GPS identificando CEP de Boa Viagem, Recife
    const mockGpsCep = '51020-010';
    setCep(mockGpsCep);
    const info = await fetchAddressByCep(mockGpsCep);
    if (info && !info.error) {
      setAddressInfo(info);
    }
    setLoadingCep(false);
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressActive} />
        </View>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Defina sua região</Text>

        <Text style={styles.subtitle}>
          Para mostrarmos os livros disponíveis mais perto de você.
        </Text>

        {/* Botão Usar Localização Atual (GPS) */}
        <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
          <Feather name="crosshair" size={18} color="#1E88E5" />
          <Text style={styles.locationText}>
            Usar Localização Atual (GPS)
          </Text>
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.separator} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.separator} />
        </View>

        {/* CEP com integração ViaCEP */}
        <Text style={styles.label}>Digite seu CEP</Text>

        <View style={styles.inputContainer}>
          <TextInput
            value={cep}
            onChangeText={handleCepChange}
            placeholder="Ex: 51020-010"
            placeholderTextColor="#BDBDBD"
            keyboardType="numeric"
            maxLength={9}
            style={styles.input}
          />

          {loadingCep ? (
            <ActivityIndicator size="small" color="#1E88E5" />
          ) : (
            <Feather name="map-pin" size={18} color="#1E88E5" />
          )}
        </View>

        {/* Badge do Endereço Retornado pela ViaCEP */}
        {addressInfo && addressInfo.erro ? (
          <View style={[styles.addressBadge, styles.errorBadge]}>
            <Feather name="alert-circle" size={16} color="#D32F2F" style={{ marginRight: 6 }} />
            <Text style={styles.errorBadgeText}>{addressInfo.mensagem}</Text>
          </View>
        ) : addressInfo ? (
          <View style={styles.addressBadge}>
            <Feather name="check-circle" size={16} color="#43A047" style={{ marginRight: 6 }} />
            <Text style={styles.addressText}>
              {`📍 ${[
                addressInfo.logradouro,
                addressInfo.complemento ? `(${addressInfo.complemento})` : '',
                addressInfo.bairro,
                addressInfo.localidade && addressInfo.uf ? `${addressInfo.localidade} - ${addressInfo.uf}` : ''
              ].filter(Boolean).join(', ')}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Gêneros */}
        <Text style={styles.genreTitle}>
          Gêneros Literários Favoritos
        </Text>

        <Text style={styles.genreSubtitle}>
          Quais histórias você quer encontrar? (Opcional)
        </Text>

        <View style={styles.genreContainer}>
          {genres.map((genre) => {
            const selected = selectedGenres.includes(genre);

            return (
              <TouchableOpacity
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={[
                  styles.genreChip,
                  selected && styles.genreChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.genreText,
                    selected && styles.genreTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('VisitorScreen', { selectedGenres, cep, addressInfo })}
        >
          <Text style={styles.primaryButtonText}>
            Ir para o Painel
          </Text>

          <Feather
            name="arrow-right"
            size={18}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
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
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressInactive: {
    width: 6,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 6,
  },
  progressActive: {
    width: 24,
    height: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
    marginRight: 6,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginBottom: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 20,
  },
  locationText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1E88E5',
    marginLeft: 10,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#9E9E9E',
    paddingHorizontal: 12,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#333333',
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  addressText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#2E7D32',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  genreTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  genreSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genreChipSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  genreText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  genreTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#F5F5F6',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});