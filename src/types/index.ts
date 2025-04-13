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
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  document_type: "cpf" | "cnpj";
  email: string;
  phone: string;
}
