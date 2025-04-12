
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClientCount, DeviceCount, CompletedServices, Revenue } from "@/types";
import { supabase } from "@/integrations/supabaseClient";
import { 
  Users, 
  Smartphone, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Calendar 
} from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

// Helper function to get data for the last 7 days
const getLast7DaysLabels = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
    });
  }
  return days;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [clientCount, setClientCount] = useState<ClientCount>({ total: 0, newThisMonth: 0 });
  const [deviceCount, setDeviceCount] = useState<DeviceCount>({ total: 0, needsService: 0 });
  const [services, setServices] = useState<CompletedServices>({ total: 0, completed: 0, pending: 0, percentage: 0 });
  const [revenue, setRevenue] = useState<Revenue>({ total: 0, thisMonth: 0, lastMonth: 0, percentChange: 0 });
  const [serviceChartData, setServiceChartData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);

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

        // Prepare chart data for services by date
        const last7Days = getLast7DaysLabels();
        const servicesByDay = last7Days.map(day => {
          const dayServices = servicesData?.filter(service => 
            service.created_at.split('T')[0] === day.date
          ) || [];
          
          return {
            name: day.label,
            total: dayServices.length,
            completed: dayServices.filter(s => s.status === 'completed').length,
            pending: dayServices.filter(s => s.status === 'pending').length
          };
        });
        
        setServiceChartData(servicesByDay);

        // Prepare revenue chart data
        const revenueByDay = last7Days.map(day => {
          const dayRevenue = servicesData
            ?.filter(service => 
              service.created_at.split('T')[0] === day.date && 
              service.status === 'completed' && 
              service.price
            )
            .reduce((total, service) => total + Number(service.price), 0) || 0;
          
          return {
            name: day.label,
            revenue: dayRevenue
          };
        });
        
        setRevenueChartData(revenueByDay);
        
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

      {/* Service Chart */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Serviços nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ChartContainer
                config={{
                  total: { label: "Total" },
                  completed: { label: "Concluído", theme: { light: "#10b981", dark: "#10b981" } },
                  pending: { label: "Pendente", theme: { light: "#f59e0b", dark: "#f59e0b" } },
                }}
              >
                <BarChart data={serviceChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <ChartTooltipContent>
                            {payload.map((entry) => (
                              <div key={entry.name} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>{entry.name === "total" ? "Total" : entry.name === "completed" ? "Concluídos" : "Pendentes"}</span>
                                </div>
                                <span>{entry.value}</span>
                              </div>
                            ))}
                          </ChartTooltipContent>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                  <Legend verticalAlign="top" align="right" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Faturamento nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ChartContainer
                config={{
                  revenue: { 
                    label: "Faturamento", 
                    theme: { light: "#3b82f6", dark: "#60a5fa" } 
                  },
                }}
              >
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <ChartTooltipContent>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: "#3b82f6" }}
                                />
                                <span>Faturamento</span>
                              </div>
                              <span>{formatCurrency(Number(payload[0].value))}</span>
                            </div>
                          </ChartTooltipContent>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#revenueGradient)" 
                  />
                  <Legend verticalAlign="top" align="right" />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar/Upcoming Services Card */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Próximos Serviços</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.pending === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum serviço pendente no momento
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-primary">{services.pending}</div>
                <p className="text-muted-foreground">Serviços aguardando atendimento</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
