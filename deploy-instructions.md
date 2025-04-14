# Instruções de Deploy - Paulo Cell Manager Pro

Este documento contém as instruções detalhadas para implantar a aplicação Paulo Cell Manager Pro com Supabase em um VPS.

## 1. Pré-requisitos

- VPS com Ubuntu 24.04 LTS
- Domínio configurado (paulocell.com.br)
- Docker e Docker Compose instalados no VPS
- Acesso SSH ao servidor

## 2. Preparação Local

1. Certifique-se de que a aplicação está funcionando corretamente localmente
2. Execute o build da aplicação:
   ```bash
   npm run build
   ```
3. Prepare os arquivos de configuração incluídos neste repositório

## 3. Configuração do VPS

### 3.1 Configuração inicial do servidor

1. Conecte-se ao VPS via SSH:
   ```bash
   ssh root@92.112.176.152
   ```

2. Atualize o sistema:
   ```bash
   apt update && apt upgrade -y
   ```

3. Configure o firewall:
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

### 3.2 Instalação do Docker (se ainda não estiver instalado)

```bash
apt install docker.io docker-compose -y
systemctl enable --now docker
```

## 4. Deploy

### 4.1 Upload dos arquivos de configuração

Faça upload dos scripts e arquivos de configuração para o servidor:

```bash
scp install-nginx.sh install-ssl-certificates.sh update-supabase-config.sh nginx-supabase-config.conf root@92.112.176.152:/root/
```

### 4.2 Configuração do Nginx e SSL

1. Execute o script de instalação do Nginx:
   ```bash
   cd /root
   chmod +x install-nginx.sh
   ./install-nginx.sh
   ```

2. Execute o script para obter certificados SSL:
   ```bash
   chmod +x install-ssl-certificates.sh
   ./install-ssl-certificates.sh
   ```

### 4.3 Configuração do Supabase

1. Execute o script para configurar o Supabase com HTTPS:
   ```bash
   chmod +x update-supabase-config.sh
   ./update-supabase-config.sh
   ```

   > **Nota**: O script já possui as chaves de configuração do Supabase definidas. Nenhuma edição adicional é necessária.

2. Obtenha a chave pública/anônima:
   - Acesse o painel admin do Supabase em `https://paulocell.com.br/supabase-admin`
   - Navegue para Configurações do Projeto > API
   - Anote a chave `anon public`

## 5. Deploy da Aplicação

### 5.1 Upload dos arquivos da aplicação

Faça upload do build da aplicação para o servidor:

```bash
scp -r ./dist/* root@92.112.176.152:/var/www/paulocell.com.br/html/
```

### 5.2 Teste da aplicação

1. Acesse a aplicação pelo navegador: `https://paulocell.com.br`
2. Verifique se todas as funcionalidades estão operando corretamente
3. Teste o login e as operações que dependem do Supabase

Se a aplicação não estiver funcionando corretamente:
- Verifique os logs do Nginx: `journalctl -u nginx`
- Verifique os logs do Docker: `docker logs supabase_kong_1`
- Reinicie o Nginx se necessário: `systemctl restart nginx`

## 6. Segurança e Manutenção

### Backups regulares

Configure backups do banco de dados:

```bash
# Criar um backup do banco de dados
docker exec -t supabase_db_1 pg_dump -U postgres postgres > supabase_backup_$(date +%Y%m%d).sql

# Exemplo de script para backup diário (adicione ao crontab)
echo "0 2 * * * docker exec -t supabase_db_1 pg_dump -U postgres postgres > /root/backups/supabase_backup_\$(date +\%Y\%m\%d).sql" >> /tmp/crontab
crontab /tmp/crontab
```

### Atualizações futuras

Para atualizar a aplicação no futuro:

1. Execute o build da nova versão localmente
2. Faça upload dos novos arquivos para o servidor
3. Se necessário, atualize as configurações do Supabase 