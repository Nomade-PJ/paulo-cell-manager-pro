# Instruções para Migração do Projeto para Nova Instância do Supabase

Este documento contém o passo a passo para migrar o projeto Cell Manager Pro para uma nova instância do Supabase.

## 1. Criar Nova Instância do Supabase

- Acesse [dashboard.supabase.com](https://dashboard.supabase.com)
- Crie uma nova organização (se necessário)
- Crie um novo projeto
- Selecione uma região próxima aos usuários
- Defina uma senha forte para o banco de dados

## 2. Copiar e Executar os Scripts SQL

- Acesse o "SQL Editor" no painel da nova instância do Supabase
- Cole e execute o conteúdo do arquivo `migration_scripts.sql` que foi gerado
- Certifique-se de executar os scripts na ordem correta (tabelas -> funções -> políticas RLS)

## 3. Configurar Autenticação

- Acesse "Authentication" > "Providers" 
- Habilite Email/Password provider
- Configure as URLs de redirecionamento para sua aplicação:
  - Site URL: URL da sua aplicação (ex: https://seuapp.com)
  - Redirect URLs: URLs de redirecionamento após login (ex: https://seuapp.com/*)

## 4. Atualizar as Chaves de API no Projeto

- Já atualizamos o `SUPABASE_PUBLISHABLE_KEY` (chave anon) nos dois arquivos de cliente:
  - `src/integrations/supabaseClient.ts` 
  - `src/integrations/supabase/client.ts`
- Falta atualizar o `SUPABASE_URL` em ambos os arquivos acima
- Obtenha a URL no painel do Supabase em "Settings" > "API"

## 5. Testar a Conexão

- Após atualizar as chaves, execute o projeto localmente:
  ```
  npm run dev
  ```
- Teste as funcionalidades de login, cadastro e acesso às tabelas
- Verifique se todas as operações CRUD funcionam corretamente

## 6. Enviar para o GitHub

- Após confirmar que tudo está funcionando localmente, faça commit das alterações:
  ```
  git add .
  git commit -m "Migração para nova instância do Supabase"
  git push origin main
  ```

## Observações Importantes

- **Não compartilhe publicamente** no GitHub a chave de serviço (service_role)
- Se houver muitos dados a serem migrados, considere usar a funcionalidade de backup/restore do Supabase
- Mantenha cópias dos scripts e do arquivo de configuração original até confirmar que tudo está funcionando na nova instância
- Se precisar migrar dados existentes, explore a opção de exportação/importação CSV através da interface do Supabase 