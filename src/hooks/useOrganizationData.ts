
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabaseClient';
import { useOrganization } from '@/contexts/OrganizationContext';

// A generic hook to fetch data from Supabase with organization filtering
export function useOrganizationData<T>(
  tableName: string, 
  options: {
    additionalFilters?: Record<string, any>,
    orderBy?: { column: string, ascending: boolean },
    limit?: number,
    select?: string
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentOrganization } = useOrganization();
  
  const { additionalFilters, orderBy, limit, select } = options;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Start building the query
        let query = supabase
          .from(tableName)
          .select(select || '*')
          .eq('organization_id', currentOrganization.id);
          
        // Apply additional filters if provided
        if (additionalFilters) {
          Object.entries(additionalFilters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        // Apply ordering if provided
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }
        
        // Apply limit if provided
        if (limit) {
          query = query.limit(limit);
        }
          
        const { data, error } = await query;
        
        if (error) throw error;
        
        setData(data as T[]);
      } catch (err: any) {
        console.error(`Error fetching ${tableName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tableName, currentOrganization?.id, JSON.stringify(additionalFilters), JSON.stringify(orderBy), limit, select]);
  
  return { data, loading, error, refetch: () => {} };
}
