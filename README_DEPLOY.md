# Paulo Cell Manager Pro - VPS Deployment

Este documento serve como guia principal para migrar e configurar a aplicação Paulo Cell Manager Pro para usar o Supabase auto-hospedado no seu VPS da Hostinger.

## Arquivos de Configuração

Nesta pasta você encontrará todos os arquivos necessários para configurar o Supabase, Nginx e fazer o deploy da aplicação:

### Scripts e Configurações

1. **nginx-supabase-config.conf** - Configuração do Nginx que atua como proxy reverso
2. **install-nginx.sh** - Script para instalar e configurar o Nginx
3. **install-ssl-certificates.sh** - Script para obter certificados SSL Let's Encrypt
4. **update-supabase-config.sh** - Script para configurar o Supabase para usar HTTPS

### Instruções

1. **deploy-instructions.md** - Guia detalhado passo a passo para fazer o deploy completo
2. **deploy-readme.md** - Guia rápido e informações de manutenção

### Arquivos de Aplicação

Estes são os arquivos da aplicação que foram atualizados para usar o Supabase no VPS:

1. **src/integrations/supabaseClient.ts** - Cliente Supabase principal
2. **src/integrations/supabase/client.ts** - Cliente Supabase secundário

## Passo a Passo Resumido

### 1. Configuração do DNS

- Configure os registros A no Hostinger:
  - paulocell.com.br -> 92.112.176.152
  - www.paulocell.com.br -> 92.112.176.152

### 2. Preparação do Servidor

1. Faça upload dos scripts para o servidor:
   ```bash
   scp *.sh *.conf root@92.112.176.152:/root/
   ```

2. Execute os scripts na ordem:
   ```bash
   chmod +x *.sh
   ./install-nginx.sh
   ./install-ssl-certificates.sh
   ./update-supabase-config.sh
   ```

### 3. Construção e Deploy da Aplicação

1. Construa a aplicação localmente:
   ```bash
   npm run build
   ```

2. Faça upload para o servidor:
   ```bash
   cd dist  # ou build
   zip -r ../paulocell-build.zip *
   scp ../paulocell-build.zip root@92.112.176.152:/tmp/
   ```

3. No servidor, extraia os arquivos:
   ```bash
   cd /var/www/paulocell.com.br/html
   rm -rf *
   unzip /tmp/paulocell-build.zip -d .
   ```

4. Obtenha a chave anon/public do Supabase no VPS e atualize no código.

### 4. Teste e Verificação

Acesse a aplicação em https://paulocell.com.br e verifique:
- Registro de usuários
- Login
- Acesso ao banco de dados

## Problemas Comuns

1. **SSL não funciona**: Verifique os certificados e a configuração do Nginx
2. **Aplicação não conecta ao Supabase**: Verifique a chave anon/public e as configurações CORS
3. **Erros de autenticação**: Verifique as URLs de redirecionamento na configuração de autenticação do Supabase

## Manutenção

- Para atualizações da aplicação, reconstrua e faça upload dos novos arquivos
- Os certificados SSL serão renovados automaticamente pelo certbot
- Para backups, configure agendamentos regulares do banco de dados

---

Para instruções mais detalhadas, consulte o arquivo `deploy-instructions.md`. 