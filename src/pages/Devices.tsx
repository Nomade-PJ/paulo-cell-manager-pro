
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

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispositivos</h1>
        <Button>
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
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Número de Série</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Acessórios</TableHead>
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
                  <TableCell>{device.serial_number || "—"}</TableCell>
                  <TableCell>{device.imei || "—"}</TableCell>
                  <TableCell>{renderConditionBadge(device.condition)}</TableCell>
                  <TableCell>
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
    </div>
  );
};

export default Devices;
