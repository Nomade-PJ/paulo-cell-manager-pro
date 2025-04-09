
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
import { Plus, Search, FileEdit, Smartphone, HardDrive } from "lucide-react";
import { Device } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Simulação de dados (em produção seria uma chamada para a API)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockDevices: Device[] = [
          {
            id: "d1",
            customer_id: "c1",
            brand: "Apple",
            model: "iPhone 12",
            serial_number: "ABCD1234EFGH",
            imei: "123456789012345",
            condition: "Bom",
            accessories: ["Carregador", "Capa"],
            notes: "Arranhões na lateral direita",
            created_at: "2024-03-10T14:30:00Z",
            updated_at: "2024-03-10T14:30:00Z"
          },
          {
            id: "d2",
            customer_id: "c2",
            brand: "Samsung",
            model: "Galaxy S21",
            serial_number: "SAMS21456789",
            imei: "987654321098765",
            condition: "Regular",
            accessories: ["Carregador"],
            notes: "Tela quebrada no canto",
            created_at: "2024-03-15T10:20:00Z",
            updated_at: "2024-03-15T10:20:00Z"
          },
          {
            id: "d3",
            customer_id: "c3",
            brand: "Xiaomi",
            model: "Redmi Note 10",
            serial_number: "XM10987654",
            imei: "456789012345678",
            condition: "Bom",
            created_at: "2024-03-25T16:45:00Z",
            updated_at: "2024-03-25T16:45:00Z"
          },
          {
            id: "d4",
            customer_id: "c4",
            brand: "Motorola",
            model: "Moto G60",
            serial_number: "MTRL60123456",
            imei: "789012345678901",
            condition: "Ruim",
            notes: "Não liga, danos por água",
            created_at: "2024-04-02T09:15:00Z",
            updated_at: "2024-04-02T09:15:00Z"
          },
          {
            id: "d5",
            customer_id: "c5",
            brand: "Apple",
            model: "iPhone 13 Pro",
            serial_number: "APIP13PRO7890",
            imei: "234567890123456",
            condition: "Excelente",
            accessories: ["Carregador", "Fones", "Capa original"],
            created_at: "2024-04-05T11:30:00Z",
            updated_at: "2024-04-05T11:30:00Z"
          }
        ];
        
        setDevices(mockDevices);
      } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter(device => 
    device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.serial_number && device.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.imei && device.imei.includes(searchTerm))
  );

  // Função para renderizar o badge de condição
  const renderConditionBadge = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'Excelente': 'bg-green-500',
      'Bom': 'bg-blue-500',
      'Regular': 'bg-yellow-500',
      'Ruim': 'bg-red-500'
    };
    
    return (
      <Badge className={conditionMap[condition] || 'bg-gray-500'}>
        {condition}
      </Badge>
    );
  };

  // Cards para visualização mobile
  const MobileDeviceCard = ({ device }: { device: Device }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-medium">{device.brand} {device.model}</h3>
          <p className="text-xs text-gray-500">{device.serial_number || "—"}</p>
        </div>
        <div>{renderConditionBadge(device.condition)}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-500">IMEI</p>
          <p className="truncate">{device.imei || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Acessórios</p>
          <p className="truncate">{device.accessories?.length 
            ? device.accessories.join(", ")
            : "—"}</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" size="sm">
          <Smartphone className="h-4 w-4 mr-1" />
          <span className="text-xs">Ver</span>
        </Button>
        <Button variant="ghost" size="sm">
          <FileEdit className="h-4 w-4 mr-1" />
          <span className="text-xs">Editar</span>
        </Button>
        <Button variant="ghost" size="sm">
          <HardDrive className="h-4 w-4 mr-1 text-blue-500" />
          <span className="text-xs">Dados</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dispositivos</h1>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
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
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="hidden md:table-cell">Número de Série</TableHead>
                <TableHead className="hidden md:table-cell">IMEI</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead className="hidden lg:table-cell">Acessórios</TableHead>
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
                    <TableCell className="hidden md:table-cell">{device.serial_number || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{device.imei || "—"}</TableCell>
                    <TableCell>{renderConditionBadge(device.condition)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {device.accessories?.length 
                        ? device.accessories.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon">
                        <Smartphone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <HardDrive className="h-4 w-4 text-blue-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Devices;
