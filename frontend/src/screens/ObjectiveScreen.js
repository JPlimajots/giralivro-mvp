import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ObjectiveScreen({ navigation }) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const options = [
    { id: 'comprar', title: 'Comprar', subtitle: 'Encontrar livros em bom estado', icon: 'shopping-bag', iconFamily: 'Feather' },
    { id: 'vender', title: 'Vender', subtitle: 'Passar livros antigos por um preço justo', icon: 'shopping-bag', iconFamily: 'Feather' },
    { id: 'trocar', title: 'Trocar', subtitle: 'Passar os livros adiante e receber outro em troca', icon: 'refresh-cw', iconFamily: 'Feather' },
    { id: 'doar', title: 'Doar', subtitle: 'Apenas passar os livros adiante', icon: 'refresh-cw', iconFamily: 'Feather' },
  ];

  const isAllSelected = selectedOptions.length === options.length;
  const isButtonEnabled = selectedOptions.length > 0;

  const handleToggle = (id) => {
    if (id === 'todas') {
      if (isAllSelected) {
        setSelectedOptions([]); 
      } else {
        setSelectedOptions(options.map(opt => opt.id)); 
      }
    } else {
      if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter(item => item !== id));
      } else {
        setSelectedOptions([...selectedOptions, id]);
      }
    }
  };

  const renderIcon = (family, name) => {
    if (family === 'Feather') {
      return <Feather name={name} size={20} color="#1E88E5" />;
    }
    return <MaterialCommunityIcons name={name} size={22} color="#1E88E5" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com Voltar e Progresso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Qual seu principal objetivo hoje?</Text>
        <Text style={styles.subtitle}>
          Isso nos ajuda a personalizar as recomendações de leitura para a sua estante.
        </Text>

        {/* Lista de Opções */}
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          return (
            <TouchableOpacity 
              key={option.id} 
              style={[styles.card, isSelected && styles.cardSelected]}
              activeOpacity={0.7}
              onPress={() => handleToggle(option.id)}
            >
              <View style={styles.iconContainer}>
                {renderIcon(option.iconFamily, option.icon)}
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                {option.subtitle && <Text style={styles.cardSubtitle}>{option.subtitle}</Text>}
              </View>

              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Botão "Todas as opções" */}
        <TouchableOpacity 
          style={[styles.card, isAllSelected && styles.cardSelected, { marginTop: 8 }]}
          activeOpacity={0.7}
          onPress={() => handleToggle('todas')}
        >
          <View style={styles.iconContainer}>
            {renderIcon('MaterialCommunityIcons', 'infinity')}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Todas as opções</Text>
          </View>

          <View style={[styles.radioOuter, isAllSelected && styles.radioOuterSelected]}>
            {isAllSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Botão Continuar */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isButtonEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
          disabled={!isButtonEnabled}
          onPress={() => navigation.navigate('VisitorScreen')}
        >
          <Text style={[styles.buttonText, isButtonEnabled ? styles.buttonTextEnabled : styles.buttonTextDisabled]}>
            Continuar
          </Text>
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
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressActive: {
    width: 24,
    height: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
    marginRight: 6,
  },
  progressInactive: {
    width: 6,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: '#333333',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4F4F4F',
    lineHeight: 22,
    marginBottom: 32,
  },
  // Estilos dos Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#1E88E5',
    backgroundColor: '#FAFCFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FD', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 16,
    color: '#333333',
  },
  cardSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
  },
  // Radio Buttons
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9E9E9E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1E88E5',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E88E5',
  },
  // Footer e Botão
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#F5F5F6',
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#005BB5', // Azul um pouco mais escuro para o botão ativo 
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  buttonTextEnabled: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#9E9E9E',
  },
});
