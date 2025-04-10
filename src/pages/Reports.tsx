
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabaseClient';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [period, setPeriod] = useState('6');
  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = subMonths(endDate, parseInt(period));
      
      // Fetch services within the date range
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Process data for charts
      processServiceData(data || []);
      processStatusData(data || []);
      processServiceTypeData(data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Process data for revenue by month chart
  const processServiceData = (data: any[]) => {
    const monthlyData: Record<string, number> = {};
    
    // Initialize all months in range
    const months = parseInt(period);
    for (let i = months; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      monthlyData[monthYear] = 0;
    }
    
    // Sum revenue by month
    data.forEach(service => {
      const date = new Date(service.created_at);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      
      if (monthlyData[monthYear] !== undefined) {
        monthlyData[monthYear] += service.price || 0;
      }
    });
    
    // Convert to array for chart
    const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
    
    setServiceData(chartData);
  };
  
  // Process data for status chart
  const processStatusData = (data: any[]) => {
    const statusCounts: Record<string, number> = {
      'pending': 0,
      'in_progress': 0,
      'waiting_parts': 0,
      'completed': 0,
      'delivered': 0
    };
    
    data.forEach(service => {
      const status = service.status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      status: getStatusLabel(status),
      count
    }));
    
    setStatusData(chartData);
  };
  
  // Process data for service type chart
  const processServiceTypeData = (data: any[]) => {
    const typeCounts: Record<string, number> = {};
    
    data.forEach(service => {
      const type = service.service_type;
      if (typeCounts[type] === undefined) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(typeCounts).map(([type, count]) => ({
      type: getServiceTypeLabel(type),
      count
    }));
    
    // Sort by count descending
    chartData.sort((a, b) => b.count - a.count);
    
    setServiceTypeData(chartData);
  };
  
  // Helper function to translate status
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em andamento',
      'waiting_parts': 'Aguardando peças',
      'completed': 'Concluído',
      'delivered': 'Entregue'
    };
    
    return labels[status] || status;
  };
  
  // Helper function to translate service type
  const getServiceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'screen_repair': 'Troca de Tela',
      'battery_replacement': 'Troca de Bateria',
      'water_damage': 'Dano por Água',
      'software_issue': 'Problema de Software',
      'charging_port': 'Porta de Carregamento',
      'button_repair': 'Reparo de Botões',
      'camera_repair': 'Reparo de Câmera',
      'mic_speaker_repair': 'Reparo de Microfone/Alto-falante',
      'diagnostics': 'Diagnóstico',
      'unlocking': 'Desbloqueio',
      'data_recovery': 'Recuperação de Dados',
      'other': 'Outro'
    };
    
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último mês</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Receita total por mês no período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Serviços por status no período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Quantidade']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Serviço</CardTitle>
            <CardDescription>Serviços mais comuns no período</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={serviceTypeData.slice(0, 5)} // Show top 5 only
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
