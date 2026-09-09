-- ========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS E RLS (SUPABASE)
-- PROJETO GIRALIVRO - MUNDO 2 (UFRPE)
-- ========================================================

-- 1. Tabela de Perfis de Usuário
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

-- 2. Catálogo Universal de Livros (Metadados da Obra)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20) UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    genre TEXT,
    page_count INT,
    publisher TEXT,
    published_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Anúncios Físicos (Listings)
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    modality VARCHAR(30) NOT NULL, -- 'TROCA', 'VENDA', 'DOAÇÃO', 'VENDA OU TROCA'
    price NUMERIC(10,2),
    condition VARCHAR(30) NOT NULL, -- 'Novo', 'Excelente', 'Com marcas'
    description TEXT,
    status VARCHAR(20) DEFAULT 'Publicado', -- 'Publicado', 'Em Negociação', 'Negociado'
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

-- 4. Tabela de Wishlist (Interesses)
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
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Regras Profiles
CREATE POLICY "Perfis públicos são legíveis por todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Regras Catálogo de Livros
CREATE POLICY "Catálogo de livros legível por todos" ON public.books FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem cadastrar no catálogo" ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Regras Anúncios (Listings)
CREATE POLICY "Anúncios são públicos para leitura" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Usuários logados podem criar anúncios" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono do anúncio pode atualizar" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Dono do anúncio pode deletar" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- Regras Wishlist
CREATE POLICY "Dono pode ler própria wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Dono pode adicionar na wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono pode remover da wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ========================================================
-- REGISTRO DO STORAGE BUCKET 'book-covers' E SUAS RLS
-- ========================================================

-- Inserção do bucket no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para o Storage Bucket 'book-covers'
CREATE POLICY "Qualquer pessoa pode visualizar fotos de capa" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'book-covers');

CREATE POLICY "Usuários autenticados podem fazer upload de capas" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem apagar suas capas" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'book-covers' AND auth.role() = 'authenticated');
