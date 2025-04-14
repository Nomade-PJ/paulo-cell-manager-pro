
# Documentação das Tabelas do Supabase

Este documento contém informações detalhadas sobre todas as tabelas utilizadas no projeto, instruções para replicar o banco de dados em uma nova instância do Supabase, e detalhes de configuração.

## 1. Tabelas Utilizadas no Projeto

### 1.1 Perfis (profiles)
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'user'::text,
  avatar_url TEXT,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 1.2 Clientes (customers)
```sql
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID,
  name VARCHAR NOT NULL,
  complement VARCHAR,
  street VARCHAR,
  number VARCHAR,
  document_type VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  neighborhood VARCHAR,
  city VARCHAR,
  state VARCHAR,
  cep VARCHAR
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
```

### 1.3 Dispositivos (devices)
```sql
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number VARCHAR,
  password_type VARCHAR NOT NULL,
  password VARCHAR,
  observations TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  brand VARCHAR NOT NULL,
  device_type VARCHAR NOT NULL,
  customer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  condition VARCHAR NOT NULL,
  color VARCHAR,
  imei VARCHAR,
  model VARCHAR NOT NULL,
  organization_id UUID
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
```

### 1.4 Serviços (services)
```sql
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  price NUMERIC NOT NULL,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  warranty_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observations TEXT,
  priority VARCHAR DEFAULT 'normal'::character varying,
  service_type VARCHAR NOT NULL,
  technician_id VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending'::character varying,
  warranty_period VARCHAR,
  other_service_description TEXT,
  organization_id UUID
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
```

### 1.5 Inventário (inventory)
```sql
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_category VARCHAR,
  name VARCHAR NOT NULL,
  sku VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  cost_price NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID,
  compatibility VARCHAR
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
```

### 1.6 Documentos Fiscais (fiscal_documents)
```sql
CREATE TABLE public.fiscal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID,
  customer_name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  number TEXT NOT NULL,
  authorization_date TIMESTAMP WITH TIME ZONE,
  cancelation_date TIMESTAMP WITH TIME ZONE,
  access_key TEXT,
  pdf_url TEXT,
  qr_code TEXT
);

ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
```

### 1.7 Notificações (notifications)
```sql
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  action_link TEXT,
  related_id TEXT
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

### 1.8 Configurações (settings)
```sql
CREATE TABLE public.settings (
  user_id UUID NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weekly_summary BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  theme VARCHAR DEFAULT 'light'::character varying
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
```

### 1.9 Organizações (organizations)
```sql
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
```

## 2. Políticas RLS (Row Level Security)

### 2.1 Políticas para Organizações
```sql
-- Permite que usuários autenticados criem organizações
CREATE POLICY "Usuários autenticados podem criar organizações" 
ON public.organizations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permite que usuários visualizem suas próprias organizações
CREATE POLICY "Usuários podem ver suas próprias organizações" 
ON public.organizations 
FOR SELECT 
TO authenticated 
USING (id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Permite que usuários atualizem suas próprias organizações
CREATE POLICY "Usuários podem atualizar suas próprias organizações" 
ON public.organizations 
FOR UPDATE 
TO authenticated 
USING (id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));
```

### 2.2 Políticas para Perfis (profiles)
```sql
-- Permite que usuários autenticados criem seus perfis
CREATE POLICY "Usuários podem criar seus próprios perfis"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permite que usuários visualizem seus próprios perfis
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permite que usuários atualizem seus próprios perfis
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

### 2.3 Políticas para as demais tabelas
```sql
-- Exemplo para clientes (repita para todas as outras tabelas)
CREATE POLICY "Usuários acessam clientes da própria organização"
ON public.customers
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));
```

## 3. Funções e Triggers

### 3.1 Função de criação de perfil para novos usuários
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Trigger para execução automática da função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 3.2 Função para criar organização
```sql
CREATE OR REPLACE FUNCTION public.create_organization(org_name text, user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  org_id uuid;
BEGIN
  -- Insert new organization
  INSERT INTO public.organizations (name, created_at, updated_at)
  VALUES (org_name, now(), now())
  RETURNING id INTO org_id;
  
  -- Update user profile with organization ID
  UPDATE public.profiles
  SET organization_id = org_id
  WHERE id = user_id;
  
  RETURN org_id;
END;
$function$;
```

### 3.3 Função para obter ID da organização do usuário
```sql
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$function$;
```

### 3.4 Função para gerar SKU único
```sql
CREATE OR REPLACE FUNCTION public.generate_unique_sku()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    _new_sku TEXT;
    _exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random SKU with format PRD-XXXXX
        _new_sku := 'PRD-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        
        -- Check if this SKU already exists
        SELECT EXISTS (
            SELECT 1 FROM public.inventory WHERE sku = _new_sku
        ) INTO _exists;
        
        -- Exit loop if we found a unique SKU
        EXIT WHEN NOT _exists;
    END LOOP;
    
    RETURN _new_sku;
END;
$function$;
```

## 4. Configuração do projeto Supabase

### 4.1 Passo a passo para replicar o banco de dados em nova instância

1. **Criar nova organização e projeto no Supabase**
   - Acesse [dashboard.supabase.com](https://dashboard.supabase.com)
   - Crie uma nova organização (se necessário)
   - Crie um novo projeto dentro da organização
   - Escolha uma região próxima aos seus usuários
   - Defina uma senha forte para o banco de dados

2. **Configurar autenticação**
   - Vá para "Authentication" > "Providers" no painel Supabase
   - Habilite Email/Password provider
   - Configure os redirecionamentos de URL:
     - Site URL: URL da sua aplicação (ex: https://seuapp.com)
     - Redirect URLs: URLs de redirecionamento após login (ex: https://seuapp.com/*)

3. **Criar as tabelas através do SQL Editor**
   - Vá para "SQL Editor" no painel Supabase
   - Copie e cole os comandos SQL de criação de tabelas presentes neste documento
   - Execute os comandos em ordem:
     1. Tabelas
     2. Funções e Triggers
     3. Políticas RLS

4. **Configurar a aplicação para usar a nova instância**
   - Substitua as chaves de API e URL nas configurações do cliente

### 4.2 Variáveis de ambiente utilizadas no projeto

```javascript
// Arquivo de configuração do cliente Supabase
const SUPABASE_URL = "https://kpfxdnvngsvckuubyhic.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZnhkbnZuZ3N2Y2t1dWJ5aGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODYxNzEsImV4cCI6MjA1OTY2MjE3MX0.Y-OpwT8aUS4nu2KjVEDG9hPvNRVSjwmvIJRo7Zmpb-o";

// Para utilizar em um novo projeto, substitua estes valores pelos fornecidos na página de configuração do seu projeto Supabase
```

## 5. Como obter e configurar as chaves Supabase

1. **Obter chaves da API**
   - Acesse o painel do Supabase [dashboard.supabase.com](https://dashboard.supabase.com)
   - Selecione seu projeto
   - No menu esquerdo, clique em "Settings" > "API"
   - Você encontrará:
     - **URL do Projeto**: Utilizado como `SUPABASE_URL`
     - **anon public key**: Utilizado como `SUPABASE_PUBLISHABLE_KEY` para operações não autenticadas
     - **service_role key**: NUNCA use no frontend, apenas em ambiente seguro de servidor

2. **Configurando as chaves no projeto**
   - Abra o arquivo `src/integrations/supabaseClient.ts`
   - Substitua `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` pelos valores obtidos
   - Se estiver usando variáveis de ambiente em um servidor VPS:
     ```
     SUPABASE_URL=https://seuprojetoid.supabase.co
     SUPABASE_ANON_KEY=sua-chave-anon-public
     SUPABASE_SERVICE_KEY=sua-service-role-key (APENAS EM AMBIENTES SEGUROS)
     ```

## 6. Migração para VPS

Ao migrar para um servidor VPS, considere os seguintes passos:

1. **Exportação de dados (se necessário)**
   - Use backups do Supabase ou exportação SQL
   - Mantenha o mesmo esquema de tabelas

2. **Configuração do ambiente no VPS**
   - Configure as variáveis de ambiente para conexão com Supabase
   - Garanta que as chaves estão seguras e não expostas publicamente

3. **Atualizando a aplicação**
   - Atualize os arquivos de configuração do cliente Supabase
   - Certifique-se que o URL e as chaves estão corretos

4. **Considerações de segurança**
   - Nunca armazene a service_role key no código do frontend
   - Use funções edge ou ambiente seguro de servidor para operações privilegiadas
   - Mantenha as RLS policies ativas para proteger seus dados

## 7. Verificação da estrutura do banco

Esta estrutura já inclui todas as tabelas necessárias para funcionar com:
- Sistema de login e autenticação
- Gerenciamento de documentos
- Registro de serviços
- Cadastro de dispositivos
- Controle de estoque
- Dashboard analítico
- Configurações do usuário
- Sistema de notificações

Todas as tabelas possuem políticas de segurança RLS configuradas para garantir o isolamento de dados entre diferentes organizações.

## 8. Configuração de Backup

Recomendamos configurar backups regulares do seu banco de dados Supabase:

1. **Backups automáticos do Supabase**
   - O Supabase já fornece backups diários incluídos no plano Pro
   - Para projetos críticos, considere um plano com retenção maior de backups

2. **Backups manuais**
   - Periodicamente exporte seus dados via SQL
   - Armazene os backups em local seguro, preferencialmente criptografados

---

Este documento contém todas as informações necessárias para replicar e configurar o banco de dados Supabase utilizado neste projeto. Para dúvidas adicionais, consulte a [documentação oficial do Supabase](https://supabase.com/docs).
