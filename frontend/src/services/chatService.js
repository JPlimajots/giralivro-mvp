import { supabase } from './supabase';

/**
 * Serviço de Chat e Mensagens integrado ao Supabase (Release 2).
 */

/**
 * Abre ou cria uma conversa vinculada a um anúncio específico entre o usuário atual e o anunciante.
 */
export async function getOrCreateConversation(listingId, sellerId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  if (user.id === sellerId) {
    throw new Error('Você não pode iniciar uma conversa no seu próprio anúncio.');
  }

  // 1. Tenta buscar conversa existente
  const { data: existing, error: fetchErr } = await supabase
    .from('conversas')
    .select('*, listings(id, title, transaction_type, status, book_id, books(title, author, cover_image_url)), anunciante:profiles!conversas_anunciante_id_fkey(id, full_name, avatar_url), interessado:profiles!conversas_interessado_id_fkey(id, full_name, avatar_url)')
    .eq('listing_id', listingId)
    .eq('interessado_id', user.id)
    .maybeSingle();

  if (fetchErr) {
    console.error('Erro ao buscar conversa existente:', fetchErr);
  }

  if (existing) {
    return existing;
  }

  // 2. Se não existir, cria nova
  const { data: created, error: insertErr } = await supabase
    .from('conversas')
    .insert({
      listing_id: listingId,
      anunciante_id: sellerId,
      interessado_id: user.id,
      status: 'ATIVA',
    })
    .select('*, listings(id, title, transaction_type, status, book_id, books(title, author, cover_image_url)), anunciante:profiles!conversas_anunciante_id_fkey(id, full_name, avatar_url), interessado:profiles!conversas_interessado_id_fkey(id, full_name, avatar_url)')
    .single();

  if (insertErr) throw insertErr;
  return created;
}

/**
 * Busca as mensagens de uma conversa específica com paginação.
 */
export async function fetchMessages(conversaId) {
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Envia uma mensagem de texto (validação: 1 a 1000 caracteres).
 */
export async function sendMessage(conversaId, text) {
  const trimmed = text ? text.trim() : '';
  if (!trimmed) {
    throw new Error('Mensagem vazia não pode ser enviada.');
  }
  if (trimmed.length > 1000) {
    throw new Error('Mensagem excede o limite de 1.000 caracteres.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data, error } = await supabase
    .from('mensagens')
    .insert({
      conversa_id: conversaId,
      remetente_id: user.id,
      conteudo: trimmed,
      status_leitura: 'ENVIADA',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lista todas as conversas do usuário logado (seja como anunciante ou interessado).
 */
export async function fetchMyConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data, error } = await supabase
    .from('conversas')
    .select(`
      id,
      listing_id,
      anunciante_id,
      interessado_id,
      status,
      created_at,
      updated_at,
      listings(id, title, transaction_type, status, books(title, author, cover_image_url)),
      anunciante:profiles!conversas_anunciante_id_fkey(id, full_name, avatar_url),
      interessado:profiles!conversas_interessado_id_fkey(id, full_name, avatar_url),
      mensagens(id, conteudo, created_at, status_leitura, remetente_id)
    `)
    .or(`anunciante_id.eq.${user.id},interessado_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Bloquear usuário.
 */
export async function blockUser(blockedUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { error } = await supabase
    .from('bloqueios_usuario')
    .insert({
      bloqueador_id: user.id,
      bloqueado_id: blockedUserId,
    });

  if (error) throw error;
}

/**
 * Denunciar usuário/conversa.
 */
export async function reportUser(reportedUserId, conversaId, motivo) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { error } = await supabase
    .from('denuncias')
    .insert({
      denunciante_id: user.id,
      denunciado_id: reportedUserId,
      conversa_id: conversaId,
      motivo: motivo,
    });

  if (error) throw error;
}
