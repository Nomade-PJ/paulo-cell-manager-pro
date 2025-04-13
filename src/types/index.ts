
export interface FiscalDocument {
  id: string;
  number: string;
  type: "nf" | "nfce" | "nfs";
  status: "authorized" | "pending" | "canceled";
  customer_id: string;
  customer_name: string;
  issue_date: string;
  total_value: number;
  created_at: string;
  updated_at: string;
  authorization_date?: string;
  cancelation_date?: string;
  access_key?: string;
  qr_code?: string;
  pdf_url?: string;
  items?: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  organization_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  document_type: "cpf" | "cnpj";
  email: string;
  phone: string;
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
  
  // Computed property for address display
  address?: string;
}

export interface Device {
  id: string;
  customer_id: string;
  customer_name: string;
  brand: string;
  model: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  condition: string;
  password_type: 'none' | 'pin' | 'pattern' | 'password';
  password?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Dashboard statistics types
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
