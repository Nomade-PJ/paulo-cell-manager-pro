
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = "https://kpfxdnvngsvckuubyhic.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZnhkbnZuZ3N2Y2t1dWJ5aGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODYxNzEsImV4cCI6MjA1OTY2MjE3MX0.Y-OpwT8aUS4nu2KjVEDG9hPvNRVSjwmvIJRo7Zmpb-o";

// Export the supabase client with our enhanced types
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});

// Helper function to get the current user's organization ID
export async function getCurrentUserOrganizationId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found");
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
    
    if (!profile || !profile.organization_id) {
      console.log("User has no organization_id in their profile");
      return null;
    }
    
    console.log("User organization_id:", profile.organization_id);
    return profile.organization_id;
  } catch (error) {
    console.error("Failed to get user organization:", error);
    return null;
  }
}
