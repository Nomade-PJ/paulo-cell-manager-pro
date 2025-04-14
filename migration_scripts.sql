-- Etapa 1: Criação das tabelas

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.customers (
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

-- Tabela de dispositivos
CREATE TABLE IF NOT EXISTS public.devices (
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

-- Tabela de serviços
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

-- Tabela de inventário
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

-- Tabela de documentos fiscais
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

-- Tabela de logs de documentos fiscais
CREATE TABLE public.fiscal_document_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB
);

ALTER TABLE public.fiscal_document_logs ENABLE ROW LEVEL SECURITY;

-- Tabela de notificações
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

-- Tabela de configurações
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

-- Tabela de organizações
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Etapa 2: Criação de funções e triggers

-- Função para criar perfil para novos usuários
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

-- Função para criar organização
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

-- Função para obter ID da organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Função para gerar SKU único
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

-- Etapa 3: Configuração das políticas RLS

-- Políticas para Organizações
CREATE POLICY "Usuários autenticados podem criar organizações" 
ON public.organizations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem ver suas próprias organizações" 
ON public.organizations 
FOR SELECT 
TO authenticated 
USING (id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar suas próprias organizações" 
ON public.organizations 
FOR UPDATE 
TO authenticated 
USING (id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para Perfis
CREATE POLICY "Usuários podem criar seus próprios perfis"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Políticas para clientes
CREATE POLICY "Usuários acessam clientes da própria organização"
ON public.customers
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para dispositivos
CREATE POLICY "Usuários acessam dispositivos da própria organização"
ON public.devices
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para serviços
CREATE POLICY "Usuários acessam serviços da própria organização"
ON public.services
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para inventário
CREATE POLICY "Usuários acessam inventário da própria organização"
ON public.inventory
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para documentos fiscais
CREATE POLICY "Usuários acessam documentos fiscais da própria organização"
ON public.fiscal_documents
FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para logs de documentos fiscais
CREATE POLICY "Permitir inserção de logs de documentos" 
ON public.fiscal_document_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir leitura de logs de documentos da organização" 
ON public.fiscal_document_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- Políticas para notificações
CREATE POLICY "Usuários acessam suas próprias notificações"
ON public.notifications
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Políticas para configurações
CREATE POLICY "Usuários acessam suas próprias configurações"
ON public.settings
FOR ALL
TO authenticated
USING (user_id = auth.uid()); 