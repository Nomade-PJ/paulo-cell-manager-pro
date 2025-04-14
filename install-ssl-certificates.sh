#!/bin/bash

# Certifique-se de que o script seja executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

# Atualizar repositórios
echo "Atualizando repositórios..."
apt update

# Instalar certbot
echo "Instalando certbot..."
apt install -y certbot python3-certbot-nginx

# Obter certificados (usando o plugin Nginx)
echo "Obtendo certificados SSL para paulocell.com.br e www.paulocell.com.br..."
certbot --nginx -d paulocell.com.br -d www.paulocell.com.br --non-interactive --agree-tos --email seu-email@exemplo.com

# Verificar status
if [ $? -eq 0 ]; then
  echo "Certificados obtidos com sucesso!"
  echo "Os certificados serão renovados automaticamente pelo serviço certbot.timer"
else
  echo "Falha ao obter certificados. Verifique os erros acima."
  exit 1
fi

# Configurar renovação automática
echo "Verificando renovação automática..."
systemctl status certbot.timer

echo "Instruções para instalar a configuração do Nginx:"
echo "1. Copie o arquivo nginx-supabase-config.conf para /etc/nginx/sites-available/paulocell.com.br"
echo "2. Crie um link simbólico: ln -s /etc/nginx/sites-available/paulocell.com.br /etc/nginx/sites-enabled/"
echo "3. Teste a configuração: nginx -t"
echo "4. Recarregue o Nginx: systemctl reload nginx"

echo "Instalação concluída!" 