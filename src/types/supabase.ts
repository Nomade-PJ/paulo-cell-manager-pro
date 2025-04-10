
import type { Database as SupabaseDatabase } from '@/integrations/supabase/types';

// Create merged database type that includes our tables
export interface Database extends SupabaseDatabase {
  Tables: {
    profiles: SupabaseDatabase['Tables']['profiles'];
    customers: {
      Row: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        document_type: string;
        document: string;
        cep: string | null;
        state: string | null;
        city: string | null;
        neighborhood: string | null;
        street: string | null;
        number: string | null;
        complement: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        document_type: string;
        document: string;
        cep?: string | null;
        state?: string | null;
        city?: string | null;
        neighborhood?: string | null;
        street?: string | null;
        number?: string | null;
        complement?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        email?: string | null;
        phone?: string | null;
        document_type?: string;
        document?: string;
        cep?: string | null;
        state?: string | null;
        city?: string | null;
        neighborhood?: string | null;
        street?: string | null;
        number?: string | null;
        complement?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    devices: {
      Row: {
        id: string;
        customer_id: string;
        device_type: string;
        brand: string;
        model: string;
        serial_number: string | null;
        imei: string | null;
        color: string | null;
        condition: string;
        password_type: string;
        password: string | null;
        observations: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        customer_id: string;
        device_type: string;
        brand: string;
        model: string;
        serial_number?: string | null;
        imei?: string | null;
        color?: string | null;
        condition: string;
        password_type: string;
        password?: string | null;
        observations?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        customer_id?: string;
        device_type?: string;
        brand?: string;
        model?: string;
        serial_number?: string | null;
        imei?: string | null;
        color?: string | null;
        condition?: string;
        password_type?: string;
        password?: string | null;
        observations?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    services: {
      Row: {
        id: string;
        customer_id: string;
        device_id: string;
        status: string;
        service_type: string;
        other_service_description: string | null;
        technician_id: string | null;
        priority: string;
        price: number;
        cost: number | null;
        estimated_completion_date: string | null;
        completion_date: string | null;
        warranty_period: string | null;
        warranty_until: string | null;
        observations: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        customer_id: string;
        device_id: string;
        status: string;
        service_type: string;
        other_service_description?: string | null;
        technician_id?: string | null;
        priority?: string;
        price: number;
        cost?: number | null;
        estimated_completion_date?: string | null;
        completion_date?: string | null;
        warranty_period?: string | null;
        warranty_until?: string | null;
        observations?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        customer_id?: string;
        device_id?: string;
        status?: string;
        service_type?: string;
        other_service_description?: string | null;
        technician_id?: string | null;
        priority?: string;
        price?: number;
        cost?: number | null;
        estimated_completion_date?: string | null;
        completion_date?: string | null;
        warranty_period?: string | null;
        warranty_until?: string | null;
        observations?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    inventory: {
      Row: {
        id: string;
        name: string;
        sku: string;
        category: string;
        custom_category: string | null;
        compatibility: string | null;
        cost_price: number;
        selling_price: number;
        quantity: number;
        minimum_stock: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        sku: string;
        category: string;
        custom_category?: string | null;
        compatibility?: string | null;
        cost_price: number;
        selling_price: number;
        quantity?: number;
        minimum_stock?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        sku?: string;
        category?: string;
        custom_category?: string | null;
        compatibility?: string | null;
        cost_price?: number;
        selling_price?: number;
        quantity?: number;
        minimum_stock?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
    settings: {
      Row: {
        user_id: string;
        theme: string | null;
        email_notifications: boolean | null;
        sms_notifications: boolean | null;
        weekly_summary: boolean | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        user_id: string;
        theme?: string | null;
        email_notifications?: boolean | null;
        sms_notifications?: boolean | null;
        weekly_summary?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        user_id?: string;
        theme?: string | null;
        email_notifications?: boolean | null;
        sms_notifications?: boolean | null;
        weekly_summary?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}
