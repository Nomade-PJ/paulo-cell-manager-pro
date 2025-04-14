#!/bin/bash

# Certifique-se de que o script seja executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

# Verifica se o Docker está instalado (o Supabase geralmente roda em containers Docker)
if ! command -v docker &> /dev/null; then
  echo "Docker não encontrado. O Supabase geralmente roda em Docker."
  echo "Execute: apt install -y docker.io docker-compose"
  exit 1
fi

# Diretório do Supabase (ajuste conforme necessário)
SUPABASE_DIR="/opt/supabase"

echo "Atualizando a configuração do Supabase para usar HTTPS e o domínio paulocell.com.br..."

# Backup das configurações existentes
echo "Fazendo backup das configurações existentes..."
if [ -f "$SUPABASE_DIR/docker-compose.yml" ]; then
  cp "$SUPABASE_DIR/docker-compose.yml" "$SUPABASE_DIR/docker-compose.yml.backup.$(date +%Y%m%d%H%M%S)"
fi

# Definindo as chaves necessárias
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsC iAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"

# Atualizando as variáveis de ambiente
echo "Atualizando as variáveis de ambiente..."
cat << EOF > "$SUPABASE_DIR/.env"
# Supabase config
SITE_URL=https://paulocell.com.br
ADDITIONAL_REDIRECT_URLS=https://paulocell.com.br/*,https://www.paulocell.com.br/*
API_EXTERNAL_URL=https://paulocell.com.br
STUDIO_URL=https://paulocell.com.br
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_KEY

# SMTP config para emails (substitua com suas configurações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app-gmail
SMTP_ADMIN_EMAIL=seu-email@gmail.com
EOF

# Configuração CORS (ajuste conforme necessário)
echo "Atualizando configuração CORS..."
KONG_CONFIG_DIR="$SUPABASE_DIR/volumes/api/kong.yml"
if [ -f "$KONG_CONFIG_DIR" ]; then
  sed -i "s|#cors_origins:.*|cors_origins: 'https://paulocell.com.br,https://www.paulocell.com.br'|g" "$KONG_CONFIG_DIR"
fi

# Reiniciar os serviços do Supabase
echo "Reiniciando os serviços do Supabase..."
cd "$SUPABASE_DIR" && docker-compose down && docker-compose up -d

echo "Configuração do Supabase atualizada com sucesso!"
echo ""
echo "IMPORTANTE:"
echo "1. Verifique se o Supabase está funcionando corretamente: https://paulocell.com.br/rest/v1/"
echo "2. Verifique a configuração de autenticação no Studio do Supabase"
echo "3. Os arquivos da aplicação já foram atualizados com a chave anon/public correta" 