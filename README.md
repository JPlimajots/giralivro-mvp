# giralivro-mvp
MVP do GiraLivro: Plataforma de economia circular e troca de livros. Desenvolvido com React Native, FastAPI e Supabase.

## 📱 Como rodar o GiraLivro no seu celular

Para testar o aplicativo no seu próprio celular, frontend e backend precisam rodar simultaneamente na sua máquina, e o seu celular precisa estar conectado à **mesma rede Wi-Fi** do seu computador.

### 1. Pré-requisitos
* **Node.js** e **Python 3** instalados no computador.
* Aplicativo **Expo Go** instalado no celular (disponível na Play Store e App Store).
* Repositório clonado na sua máquina.

### 2. Configurando as Variáveis de Ambiente (.env)
Você precisará criar dois arquivos `.env` (um para o backend e outro para o frontend) baseados nas chaves do nosso projeto no Supabase. *Peça as chaves no grupo da equipe caso não tenha.*

**No Backend:**
Crie um arquivo chamado `.env` dentro da pasta `backend/` com o seguinte conteúdo:
` ` `env
SUPABASE_URL=https://sua-url-aqui.supabase.co
SUPABASE_KEY=sua-anon-public-key-aqui
` ` `

**No Frontend:**
Descubra o endereço IP local do seu computador na rede Wi-Fi (No Windows, abra o CMD e digite `ipconfig` para achar o *Endereço IPv4*). Crie um arquivo `.env` dentro da pasta `frontend/`:
` ` `env
EXPO_PUBLIC_SUPABASE_URL=https://sua-url-aqui.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sua-chave-publishable-aqui
EXPO_PUBLIC_API_URL=http://SEU_IP_AQUI:8000
` ` `
> **Aviso Importante:** Não use `127.0.0.1` ou `localhost` no `EXPO_PUBLIC_API_URL`. O celular precisa do IP real da sua máquina (ex: `192.168.1.15`) para conseguir acessar o backend.

### 3. Rodando o Backend (API)
Abra um terminal, acesse a pasta do backend e inicie o servidor Python liberando o acesso para a rede:

` ` `bash
# 1. Entre na pasta do backend
cd backend

# 2. Crie e ative o ambiente virtual
python -m venv venv
venv\Scripts\activate      # No Windows
source venv/bin/activate   # No Mac/Linux

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Inicie o servidor (o 0.0.0.0 permite que o celular acesse a API)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
` ` `

### 4. Rodando o Frontend (App)
Abra um **novo terminal** (mantenha o backend rodando no outro), acesse a pasta do frontend e inicie o Expo:

` ` `bash
# 1. Entre na pasta do frontend
cd frontend

# 2. Instale os pacotes do aplicativo
npm install

# 3. Inicie o servidor do Expo limpando o cache (para garantir a leitura do .env)
npx expo start -c
` ` `

### 5. Visualizando no Celular
1. Um **QR Code** gigante aparecerá no terminal do frontend.
2. Abra o aplicativo **Expo Go** no seu celular.
3. No Android, toque em "Scan QR Code". No iOS, abra o app de Câmera do iPhone e escaneie o código.
4. Aguarde o carregamento (o primeiro build pode levar alguns segundos).
