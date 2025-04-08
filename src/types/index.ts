
// Tipos para clientes
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para dispositivos
export interface Device {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  serial_number?: string;
  imei?: string;
  condition: string;
  accessories?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para serviços
export interface Service {
  id: string;
  device_id: string;
  customer_id: string;
  status: "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered" | "canceled";
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
  warranty_until?: string;
  created_at: string;
  updated_at: string;
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
