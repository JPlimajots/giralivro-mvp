-- ========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS E RLS (SUPABASE)
-- PROJETO GIRALIVRO - RELEASE 2 (MUNDO 2 / UFRPE)
-- ========================================================

-- 1. Tipos Enumerados Atualizados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'condicao_livro_enum') THEN
        CREATE TYPE condicao_livro_enum AS ENUM ('Excelente', 'Bom', 'Ruim', 'Péssimo');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_anuncio_enum') THEN
        CREATE TYPE status_anuncio_enum AS ENUM ('Disponível', 'Reservado', 'Trocado', 'Vendido', 'Doado');
    END IF;
END $$;

-- 2. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    cep VARCHAR(10),
    neighborhood TEXT,
    city TEXT,
    uf VARCHAR(2),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    favorite_genres TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    saved_amount NUMERIC(10,2) DEFAULT 240.00,
    saved_books_count INT DEFAULT 3,
    paper_saved_kg NUMERIC(6,2) DEFAULT 2.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Catálogo Universal de Livros (Metadados da Obra)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20) UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_image_url TEXT,
    description TEXT,
    genre TEXT,
    page_count INT,
    publisher TEXT,
    published_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Anúncios Físicos (Listings)
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL, -- 'TROCA', 'VENDA', 'DOACAO', 'VENDA OU TROCA'
    price NUMERIC(10,2),
    condition VARCHAR(30) NOT NULL DEFAULT 'Excelente', -- 'Excelente', 'Bom', 'Ruim', 'Péssimo'
    condition_origin VARCHAR(20) DEFAULT 'MANUAL', -- 'IA' ou 'MANUAL'
    condition_ai_justification TEXT,
    observations TEXT,
    status VARCHAR(30) DEFAULT 'Disponível', -- 'Disponível', 'Reservado', 'Trocado', 'Vendido', 'Doado'
    reservado_para_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    livro_recebido_troca TEXT,
    neighborhood TEXT DEFAULT 'Boa Viagem',
    city TEXT DEFAULT 'Recife',
    uf VARCHAR(2) DEFAULT 'PE',
    lat DOUBLE PRECISION DEFAULT -8.117,
    lng DOUBLE PRECISION DEFAULT -34.895,
    genre TEXT DEFAULT 'Ficção',
    is_school_book BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Conversas de Chat (US-01 / US-04)
CREATE TABLE IF NOT EXISTS public.conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    anunciante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interessado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ATIVA', -- 'ATIVA', 'BLOQUEADA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversa_listing_interessado UNIQUE(listing_id, interessado_id)
);

-- 6. Mensagens do Chat (US-02 / US-04)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conteudo VARCHAR(1000) NOT NULL,
    status_leitura VARCHAR(20) DEFAULT 'ENVIADA', -- 'ENVIADA', 'LIDA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bloqueios e Denúncias (US-04)
CREATE TABLE IF NOT EXISTS public.bloqueios_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloqueador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bloqueado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_bloqueio UNIQUE(bloqueador_id, bloqueado_id)
);

CREATE TABLE IF NOT EXISTS public.denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    denunciante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    denunciado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversa_id UUID REFERENCES public.conversas(id) ON DELETE SET NULL,
    motivo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Auditoria de Mudança de Status (US-08)
CREATE TABLE IF NOT EXISTS public.auditoria_anuncios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    novo_status VARCHAR(30) NOT NULL,
    alterado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Interações para Recomendação (US-09 / US-10)
CREATE TABLE IF NOT EXISTS public.interacoes_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    tipo_interacao VARCHAR(30) NOT NULL, -- 'VISUALIZACAO', 'CHAT_INICIADO', 'DISLIKE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Wishlist (Interesses)
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_title TEXT NOT NULL,
    author TEXT,
    genre TEXT,
    max_price NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Perfis: públicos para leitura, update pelo dono
CREATE POLICY "Perfis públicos são legíveis por todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Livros: leitura pública, cadastro por autenticados
CREATE POLICY "Catálogo de livros legível por todos" ON public.books FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem cadastrar no catálogo" ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Anúncios: leitura pública, CRUD pelo dono
CREATE POLICY "Anúncios são públicos para leitura" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem criar anúncios" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono do anúncio pode atualizar" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Dono do anúncio pode deletar" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- Conversas: participantes podem ler e criar
CREATE POLICY "Participantes podem visualizar conversas" ON public.conversas 
FOR SELECT USING (auth.uid() IN (anunciante_id, interessado_id));

CREATE POLICY "Interessado pode iniciar conversa" ON public.conversas 
FOR INSERT WITH CHECK (auth.uid() = interessado_id AND interessado_id != anunciante_id);

CREATE POLICY "Participantes podem atualizar conversa" ON public.conversas 
FOR UPDATE USING (auth.uid() IN (anunciante_id, interessado_id));

-- Mensagens: apenas participantes leem e remetente escreve (se não bloqueados)
CREATE POLICY "Participantes podem ler mensagens da conversa" ON public.mensagens 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversas c 
        WHERE c.id = conversa_id 
        AND auth.uid() IN (c.anunciante_id, c.interessado_id)
    )
);

CREATE POLICY "Remetente pode enviar mensagem se não bloqueado" ON public.mensagens 
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

-- Bloqueios e Denúncias
CREATE POLICY "Usuário gerencia seus próprios bloqueios" ON public.bloqueios_usuario 
FOR ALL USING (auth.uid() = bloqueador_id) WITH CHECK (auth.uid() = bloqueador_id);

CREATE POLICY "Usuário autenticado pode criar denúncia" ON public.denuncias 
FOR INSERT WITH CHECK (auth.uid() = denunciante_id);

-- Auditoria: leitura pelo dono ou interessado da negociação, inserção pelo autor
CREATE POLICY "Participantes leem auditoria do anúncio" ON public.auditoria_anuncios 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.listings l 
        WHERE l.id = listing_id AND (l.user_id = auth.uid() OR l.reservado_para_id = auth.uid())
    )
);

CREATE POLICY "Autor insere registro de auditoria" ON public.auditoria_anuncios 
FOR INSERT WITH CHECK (auth.uid() = alterado_por);

-- Interações de Recomendação: usuário gerencia suas próprias interações
CREATE POLICY "Usuário pode registrar e ler suas interações" ON public.interacoes_usuario 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "Dono pode ler própria wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Dono pode adicionar na wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono pode remover da wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- Bucket Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;
