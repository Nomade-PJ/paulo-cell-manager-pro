// Tipos para clientes
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  document_type?: 'cpf' | 'cnpj';
  document?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string; // Adicional para facilitar exibição
}

// Tipos para dispositivos
export interface Device {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  condition: string;
  password_type?: 'none' | 'pin' | 'pattern' | 'password';
  password?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  device_type?: string; // Adicionado para suporte ao tipo de dispositivo
  customer_name?: string; // Adicional para facilitar exibição
  device_info?: string; // Adicional para facilitar exibição
}

// Tipos para serviços
export interface Service {
  id: string;
  device_id: string;
  customer_id: string;
  status: "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered" | "canceled";
  service_type?: string;
  issue_description: string;
  diagnosis?: string;
  solution?: string;
  technician_id?: string;
  priority: "low" | "normal" | "high" | "urgent";
  price: number;
  cost?: number;
  parts_used?: Part[];
  estimated_completion_date?: string;
  completion_date?: string;
  warranty_period?: string;
  warranty_until?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string; // Adicional para facilitar exibição
  device_info?: string; // Adicional para facilitar exibição
  observations?: string; // Adicional para observações
}

// Tipos para inventário/peças
export interface Part {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  quantity: number;
  minimum_stock: number;
  cost_price: number;
  selling_price: number;
  supplier_id?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para documentos fiscais
export interface FiscalDocument {
  id: string;
  number: string;
  type: "nf" | "nfce" | "nfs";
  status: "pending" | "authorized" | "canceled";
  customer_id: string;
  customer_name: string;
  issue_date: string;
  total_value: number;
  items?: DocumentItem[];
  created_at: string;
  updated_at: string;
  authorization_date?: string;
  cancelation_date?: string;
  access_key?: string; // Chave de acesso para consulta
  pdf_url?: string;
  xml_url?: string;
  qr_code?: string; // Para NFCe
}

export interface DocumentItem {
  id: string;
  document_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_code?: string;
  tax_value?: number;
  discount?: number;
}

// Tipos para estatísticas do dashboard
export interface DashboardStats {
  total_services: number;
  total_clients: number;
  revenue_today: number;
  pending_services: number;
  completed_services: number;
  recent_services: Service[];
  low_stock_items: Part[];
  month_revenue: { date: string; revenue: number }[];
}

// Tipos específicos para o Dashboard
export interface ClientCount {
  total: number;
  newThisMonth: number;
}

export interface DeviceCount {
  total: number;
  needsService: number;
}

export interface CompletedServices {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface Revenue {
  total: number;
  thisMonth: number;
  lastMonth: number;
  percentChange: number;
}
