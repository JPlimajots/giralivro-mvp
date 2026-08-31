import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis do arquivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("As credenciais do Supabase não foram encontradas no .env")

# Instância global do cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
