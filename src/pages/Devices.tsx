import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileEdit, Smartphone, HardDrive, Trash2 } from "lucide-react";
import { Device, Customer } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewDeviceDialog, setViewDeviceDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDetailsDialog, setDeviceDetailsDialog] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        
        // First, get all devices
        const { data: devicesData, error: devicesError } = await supabase
          .from('devices')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (devicesError) throw devicesError;
        
        // Then, get all customers to map customer names
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name');
          
        if (customersError) throw customersError;
        
        // Create a map of customer ID to customer name for quick lookup
        const customerMap = new Map();
        customersData.forEach(customer => {
          customerMap.set(customer.id, customer.name);
        });
        
        // Transform data to match Device type
        const transformedData = devicesData.map(item => ({
          id: item.id,
          customer_id: item.customer_id,
          customer_name: customerMap.get(item.customer_id) || "Cliente desconhecido",
          brand: item.brand.charAt(0).toUpperCase() + item.brand.slice(1),
          model: item.model,
          serial_number: item.serial_number || undefined,
          imei: item.imei || undefined,
          color: item.color || undefined,
          condition: item.condition,
          password_type: item.password_type as 'none' | 'pin' | 'pattern' | 'password',
          password: item.password || undefined,
          notes: item.observations || undefined,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setDevices(transformedData);
      } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dispositivos",
          description: "Não foi possível carregar a lista de dispositivos.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
  }, [refreshTrigger]);

  const filteredDevices = devices.filter(device => 
    device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.serial_number && device.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.imei && device.imei.includes(searchTerm))
  );

  // Função para renderizar o badge de condição
  const renderConditionBadge = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'good': 'bg-green-500',
      'minor_issues': 'bg-yellow-500',
      'critical_issues': 'bg-red-500'
    };
    
    const conditionLabels: Record<string, string> = {
      'good': 'Bom estado',
      'minor_issues': 'Problemas leves',
      'critical_issues': 'Problemas críticos'
    };
    
    return (
      <Badge className={conditionMap[condition] || 'bg-gray-500'}>
        {conditionLabels[condition] || condition}
      </Badge>
    );
  };

  const handleEditDevice = (deviceId: string, customerId: string) => {
    navigate(`/dashboard/device-registration/${customerId}/${deviceId}`);
  };
  
  const handleViewDevice = (device: Device) => {
    setSelectedDevice(device);
    setViewDeviceDialog(true);
  };
  
  const handleViewDeviceData = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDetailsDialog(true);
  };
  
  const handleDeleteDevice = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    
    try {
      // First delete related services due to foreign key constraints
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('device_id', deviceToDelete);
        
      if (servicesError) throw servicesError;
      
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Dispositivo excluído",
        description: "O dispositivo foi excluído com sucesso.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao excluir dispositivo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir dispositivo",
        description: "Não foi possível excluir o dispositivo.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    }
  };

  const handleAddDevice = () => {
    // Navegar para a página de clientes com uma query param indicando que queremos selecionar um cliente para criar um dispositivo
    navigate('/dashboard/clients?action=select_for_device');
  };

  // Mobile device card component
  const MobileDeviceCard = ({ device }: { device: Device }) => (
    <div className="bg-background p-4 rounded-lg shadow mb-4 border border-border">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-medium">{device.brand} {device.model}</h3>
          <p className="text-xs text-muted-foreground">
            {device.customer_name || "Cliente desconhecido"}
          </p>
          <p className="text-xs text-muted-foreground">{device.serial_number || "—"}</p>
        </div>
        <div>{renderConditionBadge(device.condition)}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-muted-foreground">IMEI</p>
          <p className="truncate">{device.imei || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cor</p>
          <p className="truncate">{device.color || "—"}</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleViewDevice(device)}
        >
          <Smartphone className="h-4 w-4 mr-1" />
          <span className="text-xs">Ver</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleEditDevice(device.id, device.customer_id)}
        >
          <FileEdit className="h-4 w-4 mr-1" />
          <span className="text-xs">Editar</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleViewDeviceData(device)}
        >
          <HardDrive className="h-4 w-4 mr-1 text-blue-500" />
          <span className="text-xs">Dados</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleDeleteDevice(device.id)}
        >
          <Trash2 className="h-4 w-4 mr-1 text-red-500" />
          <span className="text-xs">Excluir</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dispositivos</h1>
        <Button onClick={handleAddDevice} className="gap-1">
          <Plus className="h-4 w-4" />
          Novo Dispositivo
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo, IMEI ou número de série..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isMobile ? (
        <div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum dispositivo encontrado.
            </div>
          ) : (
            filteredDevices.map((device) => (
              <MobileDeviceCard key={device.id} device={device} />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Número de Série</TableHead>
                <TableHead className="hidden md:table-cell">IMEI</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum dispositivo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>{device.brand}</TableCell>
                    <TableCell className="font-medium">{device.model}</TableCell>
                    <TableCell>{device.customer_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{device.serial_number || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{device.imei || "—"}</TableCell>
                    <TableCell>{renderConditionBadge(device.condition)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDevice(device)}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditDevice(device.id, device.customer_id)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDeviceData(device)}
                      >
                        <HardDrive className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteDevice(device.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Device Dialog */}
      <Dialog open={viewDeviceDialog} onOpenChange={setViewDeviceDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Dispositivo</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{selectedDevice.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{selectedDevice.model}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedDevice.customer_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Série</p>
                  <p>{selectedDevice.serial_number || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p>{selectedDevice.imei || "—"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cor</p>
                  <p>{selectedDevice.color || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condição</p>
                  <div className="mt-1">{renderConditionBadge(selectedDevice.condition)}</div>
                </div>
              </div>
              
              {selectedDevice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm bg-muted p-2 rounded mt-1">{selectedDevice.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDeviceDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Device Technical Details Dialog */}
      <Dialog open={deviceDetailsDialog} onOpenChange={setDeviceDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dados Técnicos do Dispositivo</DialogTitle>
            <DialogDescription>
              Informações técnicas e de acesso
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de bloqueio</p>
                  <p className="font-medium">
                    {selectedDevice.password_type === 'none' ? 'Sem bloqueio' : 
                     selectedDevice.password_type === 'pin' ? 'PIN' :
                     selectedDevice.password_type === 'pattern' ? 'Padrão' : 'Senha'}
                  </p>
                </div>
                {selectedDevice.password_type !== 'none' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Senha/Padrão</p>
                    <p className="font-medium">{selectedDevice.password || "—"}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Número de série</p>
                <p className="font-mono bg-muted p-1 rounded mt-1">{selectedDevice.serial_number || "—"}</p>
              </div>
              
              {selectedDevice.imei && (
                <div>
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p className="font-mono bg-muted p-1 rounded mt-1">{selectedDevice.imei}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de cadastro</p>
                  <p>{new Date(selectedDevice.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p>{new Date(selectedDevice.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDeviceDetailsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este dispositivo? Esta ação não pode ser desfeita e também excluirá todos os serviços associados a este dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDevice}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Devices;
