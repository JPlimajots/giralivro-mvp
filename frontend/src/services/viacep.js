import axios from 'axios';

export async function fetchAddressByCep(cepStr) {
  if (!cepStr) return null;
  const cleanCep = cepStr.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (data.erro) {
      return { erro: true, mensagem: 'CEP informado não foi encontrado.' };
    }
    return data;
  } catch {
    return { erro: true, mensagem: 'Erro de rede ao consultar o ViaCEP.' };
  }
}
