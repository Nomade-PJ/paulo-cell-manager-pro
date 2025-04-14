#!/bin/bash

# Certifique-se de que o script seja executado como root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (use sudo)"
  exit 1
fi

# Atualizar repositórios
echo "Atualizando repositórios..."
apt update

# Instalar Nginx
echo "Instalando Nginx..."
apt install -y nginx

# Verificar se o Nginx foi instalado corretamente
systemctl status nginx
if [ $? -ne 0 ]; then
  echo "Falha ao instalar o Nginx. Verifique os erros acima."
  exit 1
fi

# Criar diretório para a aplicação
echo "Criando diretório para a aplicação..."
mkdir -p /var/www/paulocell.com.br/html

# Definir permissões
echo "Configurando permissões..."
chown -R www-data:www-data /var/www/paulocell.com.br
chmod -R 755 /var/www/paulocell.com.br

# Copiar a configuração do Nginx
echo "Instalando a configuração do Nginx..."
cp nginx-supabase-config.conf /etc/nginx/sites-available/paulocell.com.br

# Criar link simbólico para habilitar o site
ln -s /etc/nginx/sites-available/paulocell.com.br /etc/nginx/sites-enabled/

# Remover o site padrão (opcional)
rm -f /etc/nginx/sites-enabled/default

# Testar a configuração
echo "Testando a configuração..."
nginx -t
if [ $? -ne 0 ]; then
  echo "Falha na configuração do Nginx. Verifique os erros acima."
  exit 1
fi

# Reiniciar o Nginx
echo "Reiniciando o Nginx..."
systemctl restart nginx

echo "Nginx instalado e configurado com sucesso!"
echo "Execute o script install-ssl-certificates.sh para configurar o SSL." 