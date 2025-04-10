
import type { SupabaseDatabase } from '@/integrations/supabase/types';

export type Database = {
  public: {
    Tables: {
      profiles: SupabaseDatabase['public']['Tables']['profiles'];
      customers: SupabaseDatabase['public']['Tables']['customers'];
      devices: SupabaseDatabase['public']['Tables']['devices'];
      services: SupabaseDatabase['public']['Tables']['services'];
      inventory: SupabaseDatabase['public']['Tables']['inventory'];
      settings: SupabaseDatabase['public']['Tables']['settings'];
    };
    Views: SupabaseDatabase['public']['Views'];
    Functions: SupabaseDatabase['public']['Functions'];
    Enums: SupabaseDatabase['public']['Enums'];
    CompositeTypes: SupabaseDatabase['public']['CompositeTypes'];
  }
};
