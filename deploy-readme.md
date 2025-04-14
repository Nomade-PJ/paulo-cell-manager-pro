# Deploy Guide - Paulo Cell Manager Pro

Este é um guia rápido para implantação da aplicação Paulo Cell Manager Pro em um VPS com Supabase self-hosted.

## Pré-requisitos

- VPS Ubuntu 24.04 (Hostinger)
- Docker e Docker Compose instalados
- Domínio: paulocell.com.br
- IP do servidor: 92.112.176.152

## Arquivos de Configuração

Incluímos todos os arquivos necessários para configurar o ambiente:

- `nginx-supabase-config.conf`: Configuração do Nginx como proxy reverso
- `install-nginx.sh`: Script para instalação e configuração do Nginx
- `install-ssl-certificates.sh`: Script para obtenção de certificados SSL Let's Encrypt
- `update-supabase-config.sh`: Script para configuração do Supabase (com as chaves já configuradas)

## Processo de Deploy Resumido

1. **Construir a aplicação**:
   ```bash
   npm run build
   ```

2. **Fazer upload dos scripts para o VPS**:
   ```bash
   scp *.sh nginx-supabase-config.conf root@92.112.176.152:/root/
   ```

3. **Executar os scripts de configuração**:
   ```bash
   ./install-nginx.sh
   ./install-ssl-certificates.sh
   ./update-supabase-config.sh
   ```

4. **Enviar arquivos da aplicação**:
   ```bash
   scp -r ./dist/* root@92.112.176.152:/var/www/paulocell.com.br/html/
   ```

5. **Verificar a aplicação**:
   Acessar https://paulocell.com.br no navegador

## Manutenção

- **Backup do banco de dados**:
  ```bash
  docker exec -t supabase_db_1 pg_dump -U postgres postgres > supabase_backup_$(date +%Y%m%d).sql
  ```

- **Reiniciar serviços** (se necessário):
  ```bash
  docker restart $(docker ps -q -f name=supabase_)
  systemctl restart nginx
  ```

Para instruções mais detalhadas, consulte `deploy-instructions.md`.

## Configuração de DNS

Para o domínio paulocell.com.br, configure:
- Registro A para paulocell.com.br -> 92.112.176.152
- Registro A para www.paulocell.com.br -> 92.112.176.152

## Segurança

- Certifique-se de configurar o firewall (ufw) para permitir apenas portas necessárias (80, 443)
- Nunca exponha a chave service_role do Supabase
- Configure backups regulares do banco de dados

## Troubleshooting

Se encontrar problemas:
- Verifique os logs do Nginx: `/var/log/nginx/error.log`
- Verifique se o Supabase está rodando: `docker ps`
- Verifique se os certificados SSL foram instalados corretamente

## Manutenção

- Certificados SSL serão renovados automaticamente pelo certbot
- Para atualizar a aplicação, apenas reconstrua e faça upload do novo build
- Para atualizar as configurações do Supabase, edite os arquivos em `/opt/supabase` 