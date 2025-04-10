
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, FileEdit, AlertTriangle, ShoppingCart } from "lucide-react";
import { Part } from "@/types";

const Inventory = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    const fetchParts = async () => {
      try {
        // Simulação de dados (em produção seria uma chamada para a API)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockParts: Part[] = [
          {
            id: "p1",
            name: "Tela iPhone 11",
            description: "Display LCD Original",
            sku: "SCR-IP11-BLK",
            category: "Telas",
            quantity: 5,
            minimum_stock: 3,
            cost_price: 250,
            selling_price: 450,
            supplier_id: "s1",
            location: "A-01",
            created_at: "2024-01-10T00:00:00Z",
            updated_at: "2024-04-05T10:30:00Z"
          },
          {
            id: "p2",
            name: "Bateria Samsung S21",
            description: "Bateria Original 4000mAh",
            sku: "BAT-SS21",
            category: "Baterias",
            quantity: 2,
            minimum_stock: 3,
            cost_price: 80,
            selling_price: 150,
            supplier_id: "s2",
            location: "B-03",
            created_at: "2024-02-15T00:00:00Z",
            updated_at: "2024-04-06T15:20:00Z"
          },
          {
            id: "p3",
            name: "Conector de Carga iPhone X",
            description: "Conector Lightning + Microfone",
            sku: "CON-IPX-CHRG",
            category: "Conectores",
            quantity: 8,
            minimum_stock: 5,
            cost_price: 40,
            selling_price: 95,
            supplier_id: "s1",
            location: "C-02",
            created_at: "2024-03-01T00:00:00Z",
            updated_at: "2024-03-01T00:00:00Z"
          },
          {
            id: "p4",
            name: "Placa Mãe Motorola G8",
            description: "Placa Principal 64GB",
            sku: "MB-MG8-64",
            category: "Placas",
            quantity: 1,
            minimum_stock: 1,
            cost_price: 180,
            selling_price: 350,
            supplier_id: "s3",
            location: "D-01",
            created_at: "2024-03-20T00:00:00Z",
            updated_at: "2024-03-20T00:00:00Z"
          },
          {
            id: "p5",
            name: "Vidro Traseiro iPhone 12",
            description: "Tampa Traseira Azul",
            sku: "BACK-IP12-BLU",
            category: "Tampas",
            quantity: 4,
            minimum_stock: 2,
            cost_price: 70,
            selling_price: 160,
            supplier_id: "s1",
            location: "A-04",
            created_at: "2024-04-01T00:00:00Z",
            updated_at: "2024-04-01T00:00:00Z"
          }
        ];
        
        setParts(mockParts);
      } catch (error) {
        console.error("Erro ao carregar inventário:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParts();
  }, []);

  const filteredParts = parts
    .filter(part => 
      categoryFilter ? part.category === categoryFilter : true
    )
    .filter(part => 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.description && part.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Obter categorias únicas para o filtro
  const categories = Array.from(new Set(parts.map(part => part.category)));

  // Função para renderizar o status do estoque
  const renderStockStatus = (quantity: number, minimum_stock: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    } else if (quantity < minimum_stock) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Estoque Baixo</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">OK</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventário</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou descrição..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preço de Venda</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-mono text-sm">{part.sku}</TableCell>
                  <TableCell className="font-medium">{part.name}</TableCell>
                  <TableCell>{part.category}</TableCell>
                  <TableCell className="font-semibold">
                    {part.quantity}
                    <span className="text-gray-400 text-sm font-normal ml-1">
                      / {part.minimum_stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    {renderStockStatus(part.quantity, part.minimum_stock)}
                  </TableCell>
                  <TableCell>
                    {part.selling_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
                  <TableCell>{part.location || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {part.quantity < part.minimum_stock && (
                      <Button variant="ghost" size="icon">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-4 w-4 text-primary" />
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

export default Inventory;
