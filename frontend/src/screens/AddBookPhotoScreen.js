import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

export default function AddBookPhotoScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraPermission.granted && mediaPermission.granted;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permissão Negada', 'É necessário permitir o acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!imageUri) {
      Alert.alert('Foto Obrigatória', 'Por favor, tire uma foto ou escolha da galeria.');
      return;
    }

    setUploading(true);
    let publicUrl = imageUri;

    try {
      // Tenta upload para o Bucket do Supabase Storage 'book-covers'
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `cover_${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('book-covers')
        .upload(filename, blob, { contentType: 'image/jpeg' });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(filename);
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Fallback para imagem local uri:', err);
    } finally {
      setUploading(false);
      navigation.navigate('AddListingDetails', { coverUrl: publicUrl });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Capa</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>FOTO DA CAPA DO LIVRO</Text>
        <Text style={styles.subtitle}>
          Tire uma foto nítida da capa física do seu livro para garantir a confiança dos compradores e trocadores.
        </Text>

        {/* Pré-visualização ou Placeholder */}
        <View style={styles.imagePreviewContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Feather name="camera" size={48} color="#9E9E9E" />
              <Text style={styles.placeholderText}>Nenhuma foto selecionada</Text>
            </View>
          )}
        </View>

        {/* Botões de Ação */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.optionButton} onPress={handleTakePhoto} activeOpacity={0.8}>
            <Feather name="camera" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text style={styles.optionButtonText}>Tirar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={handlePickGallery} activeOpacity={0.8}>
            <Feather name="image" size={20} color="#1E88E5" style={{ marginRight: 8 }} />
            <Text style={styles.optionButtonText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {/* Botão Avançar */}
        <TouchableOpacity
          style={[styles.primaryButton, (!imageUri || uploading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!imageUri || uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Avançar para Detalhes</Text>
          )}
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#1E88E5',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4F4F4F',
    lineHeight: 20,
    marginBottom: 24,
  },
  imagePreviewContainer: {
    height: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E88E5',
    height: 48,
    borderRadius: 8,
  },
  optionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1E88E5',
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
