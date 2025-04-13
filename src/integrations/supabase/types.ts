export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string
          document: string
          document_type: string
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          organization_id: string | null
          phone: string | null
          state: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document: string
          document_type: string
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          number?: string | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string
          document_type?: string
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          brand: string
          color: string | null
          condition: string
          created_at: string
          customer_id: string
          device_type: string
          id: string
          imei: string | null
          model: string
          observations: string | null
          organization_id: string | null
          password: string | null
          password_type: string
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          color?: string | null
          condition: string
          created_at?: string
          customer_id: string
          device_type: string
          id?: string
          imei?: string | null
          model: string
          observations?: string | null
          organization_id?: string | null
          password?: string | null
          password_type: string
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          color?: string | null
          condition?: string
          created_at?: string
          customer_id?: string
          device_type?: string
          id?: string
          imei?: string | null
          model?: string
          observations?: string | null
          organization_id?: string | null
          password?: string | null
          password_type?: string
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_documents: {
        Row: {
          access_key: string | null
          authorization_date: string | null
          cancelation_date: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          id: string
          issue_date: string
          number: string
          organization_id: string | null
          pdf_url: string | null
          qr_code: string | null
          status: string
          total_value: number
          type: string
          updated_at: string | null
        }
        Insert: {
          access_key?: string | null
          authorization_date?: string | null
          cancelation_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          id?: string
          issue_date: string
          number: string
          organization_id?: string | null
          pdf_url?: string | null
          qr_code?: string | null
          status: string
          total_value: number
          type: string
          updated_at?: string | null
        }
        Update: {
          access_key?: string | null
          authorization_date?: string | null
          cancelation_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          id?: string
          issue_date?: string
          number?: string
          organization_id?: string | null
          pdf_url?: string | null
          qr_code?: string | null
          status?: string
          total_value?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string
          compatibility: string | null
          cost_price: number
          created_at: string
          custom_category: string | null
          id: string
          minimum_stock: number
          name: string
          organization_id: string | null
          quantity: number
          selling_price: number
          sku: string
          updated_at: string
        }
        Insert: {
          category: string
          compatibility?: string | null
          cost_price: number
          created_at?: string
          custom_category?: string | null
          id?: string
          minimum_stock?: number
          name: string
          organization_id?: string | null
          quantity?: number
          selling_price: number
          sku: string
          updated_at?: string
        }
        Update: {
          category?: string
          compatibility?: string | null
          cost_price?: number
          created_at?: string
          custom_category?: string | null
          id?: string
          minimum_stock?: number
          name?: string
          organization_id?: string | null
          quantity?: number
          selling_price?: number
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_link: string | null
          created_at: string | null
          description: string
          id: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_link?: string | null
          created_at?: string | null
          description: string
          id?: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_link?: string | null
          created_at?: string | null
          description?: string
          id?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          organization_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          customer_id: string
          device_id: string
          estimated_completion_date: string | null
          id: string
          observations: string | null
          organization_id: string | null
          other_service_description: string | null
          price: number
          priority: string | null
          service_type: string
          status: string
          technician_id: string | null
          updated_at: string
          warranty_period: string | null
          warranty_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          device_id: string
          estimated_completion_date?: string | null
          id?: string
          observations?: string | null
          organization_id?: string | null
          other_service_description?: string | null
          price: number
          priority?: string | null
          service_type: string
          status?: string
          technician_id?: string | null
          updated_at?: string
          warranty_period?: string | null
          warranty_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          device_id?: string
          estimated_completion_date?: string | null
          id?: string
          observations?: string | null
          organization_id?: string | null
          other_service_description?: string | null
          price?: number
          priority?: string | null
          service_type?: string
          status?: string
          technician_id?: string | null
          updated_at?: string
          warranty_period?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_sku: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
