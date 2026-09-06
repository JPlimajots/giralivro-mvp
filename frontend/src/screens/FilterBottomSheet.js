import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';

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

const GENRES = [
  'Todos',
  'Ficção',
  'Romance',
  'Fantasia',
  'Ciência',
  'História',
  'Biografia',
  'Acadêmico',
  'Infantil',
  'Outros'
];

const MODALITIES = ['Todas', 'TROCA', 'VENDA', 'DOAÇÃO'];

const DISTANCES = [
  { label: 'Qualquer distância', value: 999 },
  { label: 'Até 5 km', value: 5 },
  { label: 'Até 10 km', value: 10 },
  { label: 'Até 25 km', value: 25 },
  { label: 'Até 50 km', value: 50 }
];

export default function FilterBottomSheet({
  visible,
  onClose,
  filters,
  currentFilters,
  onApply,
  onApplyFilters
}) {
  const activeFilters = currentFilters || filters || {};

  const [selectedGenre, setSelectedGenre] = useState(activeFilters.genre || 'Todos');
  const [selectedModality, setSelectedModality] = useState(activeFilters.modality || 'Todas');
  const [selectedDistance, setSelectedDistance] = useState(activeFilters.maxDistance || 999);

  useEffect(() => {
    if (activeFilters) {
      if (activeFilters.genre) setSelectedGenre(activeFilters.genre);
      if (activeFilters.modality) setSelectedModality(activeFilters.modality);
      if (activeFilters.maxDistance) setSelectedDistance(activeFilters.maxDistance);
    }
  }, [visible, activeFilters]);

  const handleApply = () => {
    const payload = {
      genre: selectedGenre === 'Todos' ? null : selectedGenre,
      modality: selectedModality === 'Todas' ? null : selectedModality,
      maxDistance: selectedDistance === 999 ? null : selectedDistance
    };

    if (typeof onApply === 'function') onApply(payload);
    if (typeof onApplyFilters === 'function') onApplyFilters(payload);
    onClose();
  };

  const handleReset = () => {
    setSelectedGenre('Todos');
    setSelectedModality('Todas');
    setSelectedDistance(999);
    const payload = { genre: null, modality: null, maxDistance: null };
    if (typeof onApply === 'function') onApply(payload);
    if (typeof onApplyFilters === 'function') onApplyFilters(payload);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.sheetContent}>
          {/* Indicador de Arraste */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtrar Busca</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Limpar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Modalidade */}
            <Text style={styles.sectionTitle}>Modalidade de Aquisição</Text>
            <View style={styles.chipsContainer}>
              {MODALITIES.map(modality => (
                <TouchableOpacity
                  key={modality}
                  style={[
                    styles.chip,
                    selectedModality === modality && styles.activeChip
                  ]}
                  onPress={() => setSelectedModality(modality)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedModality === modality && styles.activeChipText
                    ]}
                  >
                    {modality}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Distância Máxima */}
            <Text style={styles.sectionTitle}>Distância Máxima (GPS)</Text>
            <View style={styles.chipsContainer}>
              {DISTANCES.map(d => (
                <TouchableOpacity
                  key={d.label}
                  style={[
                    styles.chip,
                    selectedDistance === d.value && styles.activeChip
                  ]}
                  onPress={() => setSelectedDistance(d.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedDistance === d.value && styles.activeChipText
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gênero Literário */}
            <Text style={styles.sectionTitle}>Gênero Literário</Text>
            <View style={styles.chipsContainer}>
              {GENRES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    selectedGenre === g && styles.activeChip
                  ]}
                  onPress={() => setSelectedGenre(g)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedGenre === g && styles.activeChipText
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Botão Aplicar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  backdrop: {
    flex: 1
  },
  sheetContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '80%',
    elevation: 8
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  resetText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600'
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 10
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activeChip: {
    backgroundColor: '#E3F2FD',
    borderColor: COLORS.primary
  },
  chipText: {
    fontSize: 13,
    color: COLORS.subtitle,
    fontWeight: '500'
  },
  activeChipText: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
