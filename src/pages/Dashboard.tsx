
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Smartphone, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { DashboardStats, Service, Part } from "@/types";
import { supabase } from "@/integrations/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { addDays, format, subDays } from "date-fns";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch total services
        const { count: totalServices, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });
        
        if (servicesError) throw servicesError;
        
        // Fetch total clients
        const { count: totalClients, error: clientsError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        if (clientsError) throw clientsError;
        
        // Fetch today's revenue
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        
        const { data: todayServices, error: todayServicesError } = await supabase
          .from('services')
          .select('price')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);
        
        if (todayServicesError) throw todayServicesError;
        
        const todayRevenue = todayServices?.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0) || 0;
        
        // Fetch pending services
        const { count: pendingServices, error: pendingError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress', 'waiting_parts']);
        
        if (pendingError) throw pendingError;
        
        // Fetch completed services
        const { count: completedServices, error: completedError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .in('status', ['completed', 'delivered']);
        
        if (completedError) throw completedError;
        
        // Fetch recent services
        const { data: recentServices, error: recentError } = await supabase
          .from('services')
          .select(`
            *,
            customers!services_customer_id_fkey(name),
            devices!services_device_id_fkey(brand, model)
          `)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (recentError) throw recentError;

        // Process recent services to match our type
        const processedRecentServices: Service[] = recentServices.map((service: any) => ({
          ...service,
          customer_name: service.customers?.name,
          device_info: `${service.devices?.brand} ${service.devices?.model}`
        }));
        
        // Fetch low stock items
        const { data: lowStockItems, error: lowStockError } = await supabase
          .from('inventory')
          .select('*')
          .lt('quantity', supabase.raw('minimum_stock'))
          .limit(5);
        
        if (lowStockError) throw lowStockError;
        
        // Generate revenue data for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(today, i);
          const formattedDate = format(date, 'dd/MM');
          last7Days.push({ date: formattedDate, timestamp: date.toISOString(), revenue: 0 });
        }
        
        // Fetch revenue for each of the last 7 days
        for (const day of last7Days) {
          const startOfThisDay = new Date(new Date(day.timestamp).setHours(0, 0, 0, 0)).toISOString();
          const endOfThisDay = new Date(new Date(day.timestamp).setHours(23, 59, 59, 999)).toISOString();
          
          const { data: dayServices, error: dayServicesError } = await supabase
            .from('services')
            .select('price')
            .gte('created_at', startOfThisDay)
            .lte('created_at', endOfThisDay);
          
          if (dayServicesError) throw dayServicesError;
          
          day.revenue = dayServices?.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0) || 0;
        }
        
        // Assemble the dashboard stats
        const dashboardStats: DashboardStats = {
          total_services: totalServices || 0,
          total_clients: totalClients || 0,
          revenue_today: todayRevenue,
          pending_services: pendingServices || 0,
          completed_services: completedServices || 0,
          recent_services: processedRecentServices,
          low_stock_items: lowStockItems || [],
          month_revenue: last7Days
        };
        
        setStats(dashboardStats);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dashboard',
          description: 'Não foi possível obter os dados em tempo real.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up real-time subscription for dashboard updates
    const servicesChannel = supabase
      .channel('services_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchDashboardData();
      })
      .subscribe();
      
    const customersChannel = supabase
      .channel('customers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchDashboardData();
      })
      .subscribe();
      
    const inventoryChannel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchDashboardData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [toast]);

  const getStatusBadge = (status: Service["status"]) => {
    const statusMap = {
      pending: { label: "Pendente", class: "bg-yellow-500" },
      in_progress: { label: "Em Andamento", class: "bg-blue-500" },
      waiting_parts: { label: "Aguard. Peças", class: "bg-purple-500" },
      completed: { label: "Concluído", class: "bg-green-500" },
      delivered: { label: "Entregue", class: "bg-green-700" },
      canceled: { label: "Cancelado", class: "bg-red-500" }
    };
    
    const statusInfo = statusMap[status];
    return (
      <Badge className={statusInfo.class}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Atualizado em: {new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold">{stats?.total_services}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{stats?.total_clients}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold">
                {stats?.revenue_today.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">{stats?.pending_services}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de faturamento */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Faturamento dos Últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats?.month_revenue}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => 
                  `R$${value.toLocaleString('pt-BR')}`}
              />
              <Tooltip 
                formatter={(value) => 
                  [`R$${Number(value).toLocaleString('pt-BR')}`, "Faturamento"]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Serviços Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_services && stats.recent_services.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_services.map((service) => (
                  <div key={service.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{service.issue_description}</h4>
                        <p className="text-sm text-gray-500">
                          Cliente: {service.customer_name} • 
                          {new Date(service.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {service.device_info && (
                          <p className="text-sm text-gray-500">
                            Dispositivo: {service.device_info}
                          </p>
                        )}
                      </div>
                      <div>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm">
                        {service.priority === "urgent" && (
                          <Badge variant="destructive">URGENTE</Badge>
                        )}
                      </span>
                      <span className="font-medium">
                        {service.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum serviço recente encontrado
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Itens com Estoque Baixo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Itens com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.low_stock_items && stats.low_stock_items.length > 0 ? (
              <div className="space-y-4">
                {stats.low_stock_items.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-red-100 dark:border-red-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          SKU: {item.sku} • Categoria: {item.category}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800">
                        Estoque: {item.quantity}/{item.minimum_stock}
                      </Badge>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Preço: {item.selling_price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Repor Estoque
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum item com estoque baixo encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
