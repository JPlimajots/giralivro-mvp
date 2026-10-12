# GUIA DE AÇÕES MANUAIS — RELEASE 2 (SUPABASE & SERVIÇOS EXTERNOS)

> **Importante para Banco Já em Produção:**  
> O seu banco no Supabase utiliza internamente o enum `listing_status` (com os valores `ATIVO` e `NEGOCIADO`).  
> O script abaixo é **100% incremental**: ele adiciona os novos valores de status da Release 2 (`RESERVADO`, `TROCADO`, `VENDIDO`, `DOADO`) ao enum existente e cria as novas tabelas sem interferir em nenhum dado antigo.

---

## 1. Supabase — Executar Migration Incremental no SQL Editor

Acesse o painel do Supabase: **Dashboard > SQL Editor > New query**.

Copie e execute o arquivo [`backend/sql/migration_release_2.sql`](../backend/sql/migration_release_2.sql) (ou o bloco abaixo):

```sql
-- 1. ATUALIZAÇÃO SEGURA DA TABELA: public.listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS condition_origin VARCHAR(20) DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS condition_ai_justification TEXT,
  ADD COLUMN IF NOT EXISTS reservado_para_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS livro_recebido_troca TEXT;

-- Adiciona os novos valores de status ao enum existente listing_status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        BEGIN
            ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'RESERVADO';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'TROCADO';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'VENDIDO';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'DOADO';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 2. TABELA DE CONVERSAS DE CHAT (US-01 / US-04)
CREATE TABLE IF NOT EXISTS public.conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    anunciante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interessado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ATIVA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversa_listing_interessado UNIQUE(listing_id, interessado_id)
);

CREATE INDEX IF NOT EXISTS idx_conversas_participantes 
ON public.conversas(anunciante_id, interessado_id);

CREATE INDEX IF NOT EXISTS idx_conversas_listing 
ON public.conversas(listing_id);

-- 3. TABELA DE MENSAGENS (US-02 / US-04)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conteudo VARCHAR(1000) NOT NULL,
    status_leitura VARCHAR(20) DEFAULT 'ENVIADA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa 
ON public.mensagens(conversa_id, created_at ASC);

-- 4. TABELAS DE MODERAÇÃO: BLOQUEIOS E DENÚNCIAS (US-04)
CREATE TABLE IF NOT EXISTS public.bloqueios_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloqueador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bloqueado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_bloqueio_dupla UNIQUE(bloqueador_id, bloqueado_id)
);

CREATE TABLE IF NOT EXISTS public.denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    denunciante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    denunciado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversa_id UUID REFERENCES public.conversas(id) ON DELETE SET NULL,
    motivo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE AUDITORIA DE STATUS (US-08)
CREATE TABLE IF NOT EXISTS public.auditoria_anuncios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    novo_status VARCHAR(30) NOT NULL,
    alterado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_listing 
ON public.auditoria_anuncios(listing_id, created_at DESC);

-- 6. TABELA DE INTERAÇÕES DE RECOMENDAÇÃO (US-09 / US-10)
CREATE TABLE IF NOT EXISTS public.interacoes_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    tipo_interacao VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacoes_user 
ON public.interacoes_usuario(user_id, tipo_interacao);

-- ==============================================================================
-- POLÍTICAS DE RLS SEGURAS E IDEMPOTENTES
-- ==============================================================================

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes podem visualizar conversas" ON public.conversas;
CREATE POLICY "Participantes podem visualizar conversas" ON public.conversas 
FOR SELECT USING (auth.uid() IN (anunciante_id, interessado_id));

DROP POLICY IF EXISTS "Interessado pode iniciar conversa" ON public.conversas;
CREATE POLICY "Interessado pode iniciar conversa" ON public.conversas 
FOR INSERT WITH CHECK (auth.uid() = interessado_id AND interessado_id != anunciante_id);

DROP POLICY IF EXISTS "Participantes podem atualizar conversa" ON public.conversas;
CREATE POLICY "Participantes podem atualizar conversa" ON public.conversas 
FOR UPDATE USING (auth.uid() IN (anunciante_id, interessado_id));

DROP POLICY IF EXISTS "Participantes podem ler mensagens da conversa" ON public.mensagens;
CREATE POLICY "Participantes podem ler mensagens da conversa" ON public.mensagens 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversas c 
        WHERE c.id = conversa_id 
        AND auth.uid() IN (c.anunciante_id, c.interessado_id)
    )
);

DROP POLICY IF EXISTS "Remetente envia mensagem se nao bloqueado" ON public.mensagens;
CREATE POLICY "Remetente envia mensagem se nao bloqueado" ON public.mensagens 
FOR INSERT WITH CHECK (
    auth.uid() = remetente_id
    AND EXISTS (
        SELECT 1 FROM public.conversas c 
        WHERE c.id = conversa_id 
        AND auth.uid() IN (c.anunciante_id, c.interessado_id)
        AND NOT EXISTS (
            SELECT 1 FROM public.bloqueios_usuario b 
            WHERE (b.bloqueador_id = c.anunciante_id AND b.bloqueado_id = c.interessado_id)
               OR (b.bloqueador_id = c.interessado_id AND b.bloqueado_id = c.anunciante_id)
        )
    )
);

DROP POLICY IF EXISTS "Gerenciar proprios bloqueios" ON public.bloqueios_usuario;
CREATE POLICY "Gerenciar proprios bloqueios" ON public.bloqueios_usuario 
FOR ALL USING (auth.uid() = bloqueador_id) WITH CHECK (auth.uid() = bloqueador_id);

DROP POLICY IF EXISTS "Criar denuncia autenticada" ON public.denuncias;
CREATE POLICY "Criar denuncia autenticada" ON public.denuncias 
FOR INSERT WITH CHECK (auth.uid() = denunciante_id);

DROP POLICY IF EXISTS "Participantes leem auditoria" ON public.auditoria_anuncios;
CREATE POLICY "Participantes leem auditoria" ON public.auditoria_anuncios 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.listings l 
        WHERE l.id = listing_id AND (l.user_id = auth.uid() OR l.reservado_para_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Registrar auditoria autenticado" ON public.auditoria_anuncios;
CREATE POLICY "Registrar auditoria autenticado" ON public.auditoria_anuncios 
FOR INSERT WITH CHECK (auth.uid() = alterado_por);

DROP POLICY IF EXISTS "Gerenciar proprias interacoes" ON public.interacoes_usuario;
CREATE POLICY "Gerenciar proprias interacoes" ON public.interacoes_usuario 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 2. Supabase — Habilitar Realtime na Tabela `mensagens` (Obrigatório para o Chat)
1. No menu lateral do Supabase, clique em **Database**.
2. Clique na aba **Publications** (ou **Replication**).
3. Selecione a publicação `supabase_realtime`.
4. Ative o toggle para a tabela **`mensagens`**.
5. (Opcional) Ative também para a tabela **`conversas`**.

---

## 3. Supabase — Storage Bucket
1. No menu lateral, clique em **Storage**.
2. Certifique-se de que o bucket `book-covers` está configurado como **Public**.

---

## 4. Google AI Studio — Chave Gratuita do Gemini
1. Acesse [Google AI Studio](https://aistudio.google.com/).
2. Obtenha a API Key e cole em `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...sua_chave_aqui
   ```
