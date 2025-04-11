
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClientCount, DeviceCount, CompletedServices, Revenue } from "@/types";
import { supabase } from "@/integrations/supabaseClient";
import { Users, Smartphone, CheckCircle, DollarSign, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [clientCount, setClientCount] = useState<ClientCount>({ total: 0, newThisMonth: 0 });
  const [deviceCount, setDeviceCount] = useState<DeviceCount>({ total: 0, needsService: 0 });
  const [services, setServices] = useState<CompletedServices>({ total: 0, completed: 0, pending: 0, percentage: 0 });
  const [revenue, setRevenue] = useState<Revenue>({ total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch client data
        const { count: totalClients } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        // Get current date info for month filtering
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
        
        // Count new clients this month
        const { count: newClientsThisMonth } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', firstDayOfMonth);
        
        // Fetch device data
        const { count: totalDevices } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true });
          
        // Get all service data
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
          
        if (servicesError) throw servicesError;
        
        // Calculate service metrics
        const totalServices = servicesData ? servicesData.length : 0;
        const completedServices = servicesData ? servicesData.filter(service => service.status === 'completed').length : 0;
        const pendingServices = servicesData ? servicesData.filter(service => service.status === 'pending').length : 0;
        const servicesPercentage = totalServices > 0 ? Math.round((completedServices / totalServices) * 100) : 0;
        
        // Calculate revenue metrics
        let totalRevenue = 0;
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
        const twoMonthsAgoStart = new Date(currentYear, currentMonth - 2, 1).toISOString();
        
        if (servicesData) {
          servicesData.forEach(service => {
            if (service.status === 'completed' && service.price) {
              // Total revenue from all completed services
              totalRevenue += Number(service.price);
              
              // This month's revenue
              if (new Date(service.updated_at) >= new Date(firstDayOfMonth)) {
                thisMonthRevenue += Number(service.price);
              }
              
              // Last month's revenue
              if (
                new Date(service.updated_at) >= new Date(lastMonthStart) &&
                new Date(service.updated_at) < new Date(firstDayOfMonth)
              ) {
                lastMonthRevenue += Number(service.price);
              }
            }
          });
        }
        
        // Calculate percentage change
        const percentChange = lastMonthRevenue > 0 
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : thisMonthRevenue > 0 ? 100 : 0;
        
        // Update all state values
        setClientCount({
          total: totalClients || 0,
          newThisMonth: newClientsThisMonth || 0
        });
        
        setDeviceCount({
          total: totalDevices || 0,
          needsService: pendingServices
        });
        
        setServices({
          total: totalServices,
          completed: completedServices,
          pending: pendingServices,
          percentage: servicesPercentage
        });
        
        setRevenue({
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          percentChange: percentChange
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Setup real-time subscription for dashboard updates
    const channel = supabase
      .channel('public:services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDashboardData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Format currency for displaying
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Client Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount.total}</div>
            <p className="text-xs text-muted-foreground">
              +{clientCount.newThisMonth} novos neste mês
            </p>
          </CardContent>
        </Card>
        
        {/* Devices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dispositivos
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceCount.total}</div>
            <p className="text-xs text-muted-foreground">
              {deviceCount.needsService} aguardando serviço
            </p>
          </CardContent>
        </Card>
        
        {/* Services Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Serviços Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.completed} / {services.total}
            </div>
            <div className="mt-2">
              <Progress value={services.percentage} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {services.percentage}% de conclusão
            </p>
          </CardContent>
        </Card>
        
        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue.total)}
            </div>
            <div className="flex items-center pt-1">
              {revenue.percentChange > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : revenue.percentChange < 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
              ) : (
                <Clock className="mr-1 h-3 w-3 text-orange-500" />
              )}
              <p className={`text-xs ${revenue.percentChange > 0 ? 'text-green-500' : revenue.percentChange < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                {revenue.percentChange > 0 ? '+' : ''}{Math.round(revenue.percentChange)}% em relação ao mês anterior
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
