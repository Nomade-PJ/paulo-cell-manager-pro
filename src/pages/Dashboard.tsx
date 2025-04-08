
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Smartphone, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { DashboardStats, Service } from "@/types";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simular dados do dashboard - em produção, seria uma chamada API
        const mockData: DashboardStats = {
          total_services: 124,
          total_clients: 87,
          revenue_today: 1250.5,
          pending_services: 18,
          completed_services: 106,
          recent_services: [
            {
              id: "1",
              device_id: "d1",
              customer_id: "c1",
              status: "in_progress",
              issue_description: "Tela quebrada",
              priority: "high",
              price: 350,
              created_at: "2024-04-07T10:30:00Z",
              updated_at: "2024-04-07T14:20:00Z"
            },
            {
              id: "2",
              device_id: "d2",
              customer_id: "c2",
              status: "waiting_parts",
              issue_description: "Bateria não carrega",
              priority: "normal",
              price: 180,
              created_at: "2024-04-06T09:15:00Z",
              updated_at: "2024-04-06T11:45:00Z"
            },
            {
              id: "3",
              device_id: "d3",
              customer_id: "c3",
              status: "pending",
              issue_description: "Não liga",
              priority: "urgent",
              price: 120,
              created_at: "2024-04-08T08:00:00Z",
              updated_at: "2024-04-08T08:00:00Z"
            }
          ],
          low_stock_items: [
            {
              id: "p1",
              name: "Tela iPhone 11",
              description: "Display LCD Original",
              sku: "SCR-IP11-BLK",
              category: "Telas",
              quantity: 2,
              minimum_stock: 5,
              cost_price: 250,
              selling_price: 450,
              created_at: "2024-01-10T00:00:00Z",
              updated_at: "2024-04-05T10:30:00Z"
            },
            {
              id: "p2",
              name: "Bateria Samsung S21",
              description: "Bateria Original 4000mAh",
              sku: "BAT-SS21",
              category: "Baterias",
              quantity: 1,
              minimum_stock: 3,
              cost_price: 80,
              selling_price: 150,
              created_at: "2024-02-15T00:00:00Z",
              updated_at: "2024-04-06T15:20:00Z"
            }
          ],
          month_revenue: [
            { date: "01/04", revenue: 780 },
            { date: "02/04", revenue: 920 },
            { date: "03/04", revenue: 1100 },
            { date: "04/04", revenue: 650 },
            { date: "05/04", revenue: 750 },
            { date: "06/04", revenue: 890 },
            { date: "07/04", revenue: 1050 },
          ]
        };
        
        // Simular tempo de carregamento
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStats(mockData);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
            <div className="space-y-4">
              {stats?.recent_services.map((service) => (
                <div key={service.id} className="bg-white p-3 rounded-md border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.issue_description}</h4>
                      <p className="text-sm text-gray-500">
                        ID: {service.id} • 
                        {new Date(service.created_at).toLocaleDateString('pt-BR')}
                      </p>
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
            <div className="space-y-4">
              {stats?.low_stock_items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-md border border-red-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        SKU: {item.sku} • Categoria: {item.category}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200">
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
                    <span className="text-sm font-medium text-red-600">
                      Repor Estoque
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
