import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function LocationInterestScreen({ navigation }) {
  const [cep, setCep] = useState('');
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

        {/* Localização */}
        <TouchableOpacity style={styles.locationButton}>
          <Feather name="crosshair" size={18} color="#1E88E5" />
          <Text style={styles.locationText}>
            Usar Localização Atual
          </Text>
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.separator} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.separator} />
        </View>

        {/* CEP */}
        <Text style={styles.label}>Digite seu CEP</Text>

        <View style={styles.inputContainer}>
          <TextInput
            value={cep}
            onChangeText={setCep}
            placeholder="Ex: 50000-000"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
          />

          <Feather name="map" size={18} color="#9E9E9E" />
        </View>

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
          //onPress={() => navigation.navigate('HomeScreen')}
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
    paddingBottom: 16,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressInactive: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    marginRight: 6,
  },

  progressActive: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E88E5',
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  title: {
    fontSize: 24,
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
  },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9D8E6',
    backgroundColor: '#EAF3FC',
    height: 56,
    borderRadius: 8,
    marginBottom: 24,
  },

  locationText: {
    color: '#1E88E5',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },

  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },

  orText: {
    marginHorizontal: 12,
    color: '#9E9E9E',
    fontWeight: '600',
  },

  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },

  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 28,
  },

  genreTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },

  genreSubtitle: {
    color: '#666',
    marginTop: 6,
    marginBottom: 16,
  },

  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  genreChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DADADA',
    backgroundColor: '#FFF',
    marginRight: 10,
    marginBottom: 10,
  },

  genreChipSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },

  genreText: {
    color: '#555',
  },

  genreTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },

  primaryButton: {
    height: 56,
    borderRadius: 30,
    backgroundColor: '#005BB5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});