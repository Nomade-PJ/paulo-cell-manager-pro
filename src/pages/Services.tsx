import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/PageHeader";
import { Wrench, Search, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import ServiceActionsMenu from "@/components/ServiceActionsMenu";

// Status badge colors
const statusColors = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  waiting_parts: "bg-purple-500",
  completed: "bg-green-500",
  delivered: "bg-gray-500"
};

// Status display names
const statusNames = {
  pending: "Pendente",
  in_progress: "Em andamento",
  waiting_parts: "Aguardando peças",
  completed: "Concluído",
  delivered: "Entregue"
};

const Services = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Using "all" instead of empty string
  const [loading, setLoading] = useState(true);

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch services from the database
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          customers (
            name
          ),
          devices (
            brand,
            model
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setServices(data || []);
      setFilteredServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters when search term or status filter changes
  useEffect(() => {
    let filtered = services;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${service.devices?.brand} ${service.devices?.model}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(service => service.status === statusFilter);
    }
    
    setFilteredServices(filtered);
  }, [searchTerm, statusFilter, services]);
  
  // Format price as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Handle service edit
  const handleEdit = (service) => {
    navigate(`/service-registration/${service.customer_id}/${service.device_id}?serviceId=${service.id}`);
  };
  
  // Render status badge with appropriate color
  const renderStatusBadge = (status) => {
    return (
      <Badge className={statusColors[status]}>
        {statusNames[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Serviços" 
        description="Gerenciamento de ordens de serviço"
      >
        <Wrench className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="waiting_parts">Aguardando peças</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button className="w-full sm:w-auto" onClick={() => navigate("/dashboard/user-registration")}>
            <Plus className="h-4 w-4 mr-2" /> Novo Serviço
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando serviços...
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum serviço encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.customers?.name || "Cliente não encontrado"}</TableCell>
                    <TableCell>
                      {service.devices ? 
                        `${service.devices.brand} ${service.devices.model}` : 
                        "Dispositivo não encontrado"
                      }
                    </TableCell>
                    <TableCell>
                      {service.service_type === 'other' 
                        ? service.other_service_description 
                        : getServiceLabel(service.service_type)}
                    </TableCell>
                    <TableCell>{formatCurrency(service.price || 0)}</TableCell>
                    <TableCell>{renderStatusBadge(service.status)}</TableCell>
                    <TableCell className="text-right">
                      <ServiceActionsMenu 
                        service={service}
                        onUpdate={fetchServices}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// Helper function to get human-readable service types
const getServiceLabel = (serviceType) => {
  const serviceTypes = {
    screen_repair: "Troca de Tela",
    battery_replacement: "Troca de Bateria",
    water_damage: "Dano por Água",
    software_issue: "Problema de Software",
    charging_port: "Porta de Carregamento",
    button_repair: "Reparo de Botões",
    camera_repair: "Reparo de Câmera",
    mic_speaker_repair: "Reparo de Microfone/Alto-falante",
    diagnostics: "Diagnóstico Completo",
    unlocking: "Desbloqueio",
    data_recovery: "Recuperação de Dados",
  };
  
  return serviceTypes[serviceType] || serviceType;
};

export default Services;
