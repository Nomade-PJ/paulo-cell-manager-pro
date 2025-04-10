
// This file contains the TypeScript definitions for your Supabase database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          role: string | null;
          updated_at: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          role?: string | null;
          updated_at?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          role?: string | null;
          updated_at?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          document: string;
          created_at: string;
          name: string;
          cep: string | null;
          state: string | null;
          city: string | null;
          neighborhood: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          document_type: string;
          phone: string | null;
          updated_at: string;
          email: string | null;
        };
        Insert: {
          id?: string;
          document: string;
          created_at?: string;
          name: string;
          cep?: string | null;
          state?: string | null;
          city?: string | null;
          neighborhood?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          document_type: string;
          phone?: string | null;
          updated_at?: string;
          email?: string | null;
        };
        Update: {
          id?: string;
          document?: string;
          created_at?: string;
          name?: string;
          cep?: string | null;
          state?: string | null;
          city?: string | null;
          neighborhood?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          document_type?: string;
          phone?: string | null;
          updated_at?: string;
          email?: string | null;
        };
      };
      devices: {
        Row: {
          id: string;
          serial_number: string | null;
          password_type: string;
          password: string | null;
          observations: string | null;
          updated_at: string;
          brand: string;
          device_type: string;
          customer_id: string;
          created_at: string;
          condition: string;
          color: string | null;
          imei: string | null;
          model: string;
        };
        Insert: {
          id?: string;
          serial_number?: string | null;
          password_type: string;
          password?: string | null;
          observations?: string | null;
          updated_at?: string;
          brand: string;
          device_type: string;
          customer_id: string;
          created_at?: string;
          condition: string;
          color?: string | null;
          imei?: string | null;
          model: string;
        };
        Update: {
          id?: string;
          serial_number?: string | null;
          password_type?: string;
          password?: string | null;
          observations?: string | null;
          updated_at?: string;
          brand?: string;
          device_type?: string;
          customer_id?: string;
          created_at?: string;
          condition?: string;
          color?: string | null;
          imei?: string | null;
          model?: string;
        };
      };
      services: {
        Row: {
          id: string;
          device_id: string;
          customer_id: string;
          price: number;
          estimated_completion_date: string | null;
          warranty_until: string | null;
          created_at: string;
          updated_at: string;
          observations: string | null;
          priority: string | null;
          service_type: string;
          technician_id: string | null;
          status: string;
          warranty_period: string | null;
          other_service_description: string | null;
        };
        Insert: {
          id?: string;
          device_id: string;
          customer_id: string;
          price: number;
          estimated_completion_date?: string | null;
          warranty_until?: string | null;
          created_at?: string;
          updated_at?: string;
          observations?: string | null;
          priority?: string | null;
          service_type: string;
          technician_id?: string | null;
          status?: string;
          warranty_period?: string | null;
          other_service_description?: string | null;
        };
        Update: {
          id?: string;
          device_id?: string;
          customer_id?: string;
          price?: number;
          estimated_completion_date?: string | null;
          warranty_until?: string | null;
          created_at?: string;
          updated_at?: string;
          observations?: string | null;
          priority?: string | null;
          service_type?: string;
          technician_id?: string | null;
          status?: string;
          warranty_period?: string | null;
          other_service_description?: string | null;
        };
      };
      inventory: {
        Row: {
          id: string;
          custom_category: string | null;
          name: string;
          sku: string;
          category: string;
          cost_price: number;
          selling_price: number;
          quantity: number;
          minimum_stock: number;
          created_at: string;
          updated_at: string;
          compatibility: string | null;
        };
        Insert: {
          id?: string;
          custom_category?: string | null;
          name: string;
          sku: string;
          category: string;
          cost_price: number;
          selling_price: number;
          quantity?: number;
          minimum_stock?: number;
          created_at?: string;
          updated_at?: string;
          compatibility?: string | null;
        };
        Update: {
          id?: string;
          custom_category?: string | null;
          name?: string;
          sku?: string;
          category?: string;
          cost_price?: number;
          selling_price?: number;
          quantity?: number;
          minimum_stock?: number;
          created_at?: string;
          updated_at?: string;
          compatibility?: string | null;
        };
      };
      settings: {
        Row: {
          user_id: string;
          updated_at: string;
          theme: string | null;
          created_at: string;
          weekly_summary: boolean | null;
          sms_notifications: boolean | null;
          email_notifications: boolean | null;
        };
        Insert: {
          user_id: string;
          updated_at?: string;
          theme?: string | null;
          created_at?: string;
          weekly_summary?: boolean | null;
          sms_notifications?: boolean | null;
          email_notifications?: boolean | null;
        };
        Update: {
          user_id?: string;
          updated_at?: string;
          theme?: string | null;
          created_at?: string;
          weekly_summary?: boolean | null;
          sms_notifications?: boolean | null;
          email_notifications?: boolean | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
