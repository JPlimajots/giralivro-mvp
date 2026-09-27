import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  LogBox
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../services/supabase';

LogBox.ignoreLogs(["Response.blob() is using React Native's Blob"]);

export default function AddBookPhotoScreen({ navigation }) {
  const [photos, setPhotos] = useState([
    { id: 'cover', label: '1. Capa', desc: 'Frente do livro', uri: null },
    { id: 'spine', label: '2. Lombada', desc: 'Lateral do livro', uri: null },
    { id: 'back', label: '3. Contracapa', desc: 'Parte de trás', uri: null }
  ]);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraPerm.granted && mediaPerm.granted;
  };

  const handleSelectPhoto = async (index) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permissão Negada', 'É necessário permitir acesso à câmera e galeria.');
      return;
    }

    Alert.alert(
      'Adicionar Foto',
      `Escolha a origem da foto para a ${photos[index].label}`,
      [
        { text: 'Câmera', onPress: () => launchPicker(index, 'camera') },
        { text: 'Galeria', onPress: () => launchPicker(index, 'gallery') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const launchPicker = async (index, type) => {
    const options = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    };

    let result;
    if (type === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...photos];
      newPhotos[index].uri = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const handleContinue = async () => {
    // Verifica se as 3 fotos foram tiradas
    if (photos.some(p => !p.uri)) {
      Alert.alert('Fotos Incompletas', 'Por favor, adicione as 3 fotos (Capa, Lombada e Contracapa) para continuar.');
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    try {
      // Faz o upload sequencial das 3 imagens
      for (let i = 0; i < photos.length; i++) {
        const filename = `cover_${Date.now()}_${i}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(photos[i].uri, { encoding: 'base64' });

        const { data, error } = await supabase.storage
          .from('book-covers')
          .upload(filename, decode(base64), { contentType: 'image/jpeg' });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(filename);
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Erro no Upload', 'Não foi possível enviar as fotos. Tente novamente.');
      setUploading(false);
      return;
    }

    setUploading(false);
    // Junta as 3 URLs geradas numa única string separada por vírgulas
    const finalCoverString = uploadedUrls.join(',');
    navigation.navigate('AddListingDetails', { coverUrl: finalCoverString });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotos do Livro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>MOSTRE OS DETALHES</Text>
        <Text style={styles.subtitle}>
          Fotos reais de todos os ângulos aumentam a confiança e ajudam a fechar negócio mais rápido.
        </Text>

        {photos.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.photoSlot} 
            onPress={() => handleSelectPhoto(index)}
            activeOpacity={0.8}
          >
            {item.uri ? (
              <Image source={{ uri: item.uri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="camera" size={32} color="#9E9E9E" />
              </View>
            )}
            <View style={styles.photoInfo}>
              <Text style={styles.photoLabel}>{item.label}</Text>
              <Text style={styles.photoDesc}>{item.desc}</Text>
            </View>
            <Feather name={item.uri ? "edit-2" : "plus-circle"} size={24} color={item.uri ? "#43A047" : "#1E88E5"} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.primaryButton, (photos.some(p => !p.uri) || uploading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={photos.some(p => !p.uri) || uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Avançar para Detalhes</Text>
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
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
  title: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: '#1E88E5', marginBottom: 6 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 24 },
  photoSlot: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  photoPreview: { width: 70, height: 90, borderRadius: 8, backgroundColor: '#E0E0E0' },
  photoPlaceholder: { width: 70, height: 90, borderRadius: 8, backgroundColor: '#F5F5F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  photoInfo: { flex: 1, marginLeft: 16 },
  photoLabel: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#333', marginBottom: 4 },
  photoDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#666' },
  primaryButton: { backgroundColor: '#1E88E5', height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  buttonDisabled: { backgroundColor: '#90CAF9' },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#FFFFFF' },
});
