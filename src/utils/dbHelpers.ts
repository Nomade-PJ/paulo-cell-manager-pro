
import { supabase } from '@/integrations/supabaseClient';
import { getCurrentUserOrganizationId } from '@/integrations/supabaseClient';

// Helper to include organization_id in inserts
export async function insertWithOrg(table: string, data: any) {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from(table)
    .insert({ ...data, organization_id: organizationId });
}

// Helper to include organization_id in updates
export async function updateWithOrg(table: string, id: string, data: any) {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .eq('organization_id', organizationId);
}

// Helper to include organization_id in deletes
export async function deleteWithOrg(table: string, id: string) {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);
}

// Helper to include organization_id in select queries
export async function selectWithOrg(table: string, select: string = '*') {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from(table)
    .select(select)
    .eq('organization_id', organizationId);
}

// Helper to fix the User Registration process
export async function createCustomerWithOrg(customerData: any) {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from('customers')
    .insert({ 
      ...customerData, 
      organization_id: organizationId,
      created_at: new Date().toISOString() 
    })
    .select('id')
    .single();
}

// Helper to fix the Device Registration process
export async function createDeviceWithOrg(deviceData: any) {
  const organizationId = await getCurrentUserOrganizationId();
  
  if (!organizationId) {
    throw new Error('No organization ID found for current user');
  }
  
  return supabase
    .from('devices')
    .insert({ 
      ...deviceData, 
      organization_id: organizationId,
      created_at: new Date().toISOString() 
    })
    .select('id')
    .single();
}
