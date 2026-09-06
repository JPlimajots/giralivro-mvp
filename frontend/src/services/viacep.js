import axios from 'axios';

/**
 * Busca informações de endereço (Bairro, Cidade, Estado, Logradouro)
 * a partir de um CEP brasileiro usando a API pública e gratuita do ViaCEP.
 * 
 * @param {string} cepStr - CEP com ou sem formatação (ex: '51020-010' ou '51020010')
 * @returns {Promise<{cep: string, logradouro: string, bairro: string, localidade: string, uf: string, error?: boolean}>}
 */
export async function fetchAddressByCep(cepStr) {
  if (!cepStr) return null;
  const cleanCep = cepStr.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (response.data && !response.data.erro) {
      return {
        cep: response.data.cep,
        logradouro: response.data.logradouro,
        bairro: response.data.bairro || 'Centro',
        localidade: response.data.localidade || 'Recife',
        uf: response.data.uf || 'PE',
        formattedAddress: `${response.data.bairro ? response.data.bairro + ', ' : ''}${response.data.localidade} - ${response.data.uf}`,
      };
    }
    return { error: true, message: 'CEP não encontrado.' };
  } catch (error) {
    console.warn('Erro ao consultar ViaCEP:', error);
    return { error: true, message: 'Erro ao conectar ao serviço de CEP.' };
  }
}
