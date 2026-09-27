export const getAddressFromCep = async (cep) => {
  if (!cep) return null;
  const clean = String(cep).replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      bairro: data.bairro,
      city: data.localidade,
      uf: data.uf,
      formatted: data.bairro ? `${data.bairro}, ${data.localidade}` : `${data.localidade} - ${data.uf}`,
    };
  } catch (e) {
    return null;
  }
};
