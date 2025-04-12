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
import { 
  Plus, 
  Search, 
  FileEdit, 
  Trash2, 
  ShoppingCart,
  PackageOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogTrigger,
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  custom_category?: string | null;
  compatibility?: string | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
}

const inventoryFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  customCategory: z.string().optional(),
  compatibility: z.string().optional(),
  costPrice: z.number().nonnegative({ message: "Preço de custo não pode ser negativo" }).optional(),
  sellingPrice: z.number().nonnegative({ message: "Preço de venda não pode ser negativo" }).optional(),
  quantity: z.number().int().min(0, { message: "Quantidade não pode ser negativa" }),
  minimumStock: z.number().int().min(0, { message: "Estoque mínimo não pode ser negativo" }),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const CATEGORIES = [
  "bateria",
  "tela",
  "cabo",
  "carregador",
  "carcaça",
  "acessório",
  "outro"
];

const Inventory = () => {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [generatedSku, setGeneratedSku] = useState<string>("");
  
  // Estados para controlar os valores dos campos de preço
  const [costPriceInput, setCostPriceInput] = useState<string>("");
  const [sellingPriceInput, setSellingPriceInput] = useState<string>("");
  
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      category: "",
      customCategory: "",
      compatibility: "",
      costPrice: undefined,
      sellingPrice: undefined,
      quantity: 0,
      minimumStock: 0,
    },
  });
  
  const editForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      category: "",
      customCategory: "",
      compatibility: "",
      costPrice: undefined,
      sellingPrice: undefined,
      quantity: 0,
      minimumStock: 0,
    },
  });
  
  useEffect(() => {
    fetchInventory();
  }, [refreshTrigger]);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setInventoryItems(data as InventoryItem[]);
    } catch (error) {
      console.error("Erro ao carregar inventário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os itens do inventário.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateSku = async () => {
    try {
      setIsGeneratingSku(true);
      
      const { data, error } = await supabase
        .rpc('generate_unique_sku');
        
      if (error) throw error;
      
      setGeneratedSku(data as string);
      toast({
        title: "SKU gerado",
        description: `Novo SKU: ${data}`,
      });
    } catch (error) {
      console.error("Erro ao gerar SKU:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar SKU",
        description: "Não foi possível gerar um novo SKU.",
      });
      
      const randomSku = `PRD-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      setGeneratedSku(randomSku);
    } finally {
      setIsGeneratingSku(false);
    }
  };
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.compatibility && item.compatibility.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleEdit = (item: InventoryItem) => {
    setCurrentItem(item);
    // Definir os valores iniciais dos campos de input
    setCostPriceInput(item.cost_price === 0 ? "" : String(item.cost_price));
    setSellingPriceInput(item.selling_price === 0 ? "" : String(item.selling_price));
    
    editForm.reset({
      name: item.name,
      category: item.category,
      customCategory: item.custom_category || "",
      compatibility: item.compatibility || "",
      costPrice: item.cost_price === 0 ? undefined : item.cost_price,
      sellingPrice: item.selling_price === 0 ? undefined : item.selling_price,
      quantity: item.quantity,
      minimumStock: item.minimum_stock,
    });
    setEditItemDialogOpen(true);
  };
  
  const handleDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq('id', itemToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Item excluído",
        description: "O item foi excluído com sucesso.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir item",
        description: "Não foi possível excluir o item do inventário.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  const onSubmit = async (data: InventoryFormValues) => {
    if (!generatedSku) {
      toast({
        variant: "destructive",
        title: "SKU não gerado",
        description: "Por favor, gere um SKU antes de salvar.",
      });
      return;
    }
    
    try {
      const newItem = {
        name: data.name,
        sku: generatedSku,
        category: data.category,
        custom_category: data.category === 'outro' ? data.customCategory : null,
        compatibility: data.compatibility || null,
        cost_price: data.costPrice || 0,
        selling_price: data.sellingPrice || 0,
        quantity: data.quantity,
        minimum_stock: data.minimumStock,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("inventory")
        .insert(newItem);
        
      if (error) throw error;
      
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado ao inventário com sucesso.",
      });
      
      setNewItemDialogOpen(false);
      form.reset();
      setGeneratedSku("");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item ao inventário.",
      });
    }
  };
  
  const onEditSubmit = async (data: InventoryFormValues) => {
    if (!currentItem) return;
    
    try {
      const updatedItem = {
        name: data.name,
        category: data.category,
        custom_category: data.category === 'outro' ? data.customCategory : null,
        compatibility: data.compatibility || null,
        cost_price: data.costPrice || 0,
        selling_price: data.sellingPrice || 0,
        quantity: data.quantity,
        minimum_stock: data.minimumStock,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("inventory")
        .update(updatedItem)
        .eq('id', currentItem.id);
        
      if (error) throw error;
      
      toast({
        title: "Item atualizado",
        description: "O item foi atualizado com sucesso.",
      });
      
      setEditItemDialogOpen(false);
      editForm.reset();
      setCurrentItem(null);
      // Limpar os estados de input
      setCostPriceInput("");
      setSellingPriceInput("");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar item",
        description: "Não foi possível atualizar o item.",
      });
    }
  };
  
  const renderStockStatusBadge = (quantity: number, minimum: number) => {
    if (quantity <= 0) {
      return <Badge className="bg-red-500">Sem estoque</Badge>;
    } else if (quantity <= minimum) {
      return <Badge className="bg-yellow-500">Estoque baixo</Badge>;
    } else {
      return <Badge className="bg-green-500">Em estoque</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventário</h1>
        <Button onClick={() => {
          setGeneratedSku("");
          form.reset();
          setNewItemDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou compatibilidade..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Compatibilidade</TableHead>
              <TableHead className="text-right">Preço (R$)</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Status</TableHead>
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
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>
                    {item.category === 'outro' ? item.custom_category : 
                      item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </TableCell>
                  <TableCell>{item.compatibility || "—"}</TableCell>
                  <TableCell className="text-right">{item.selling_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {renderStockStatusBadge(item.quantity, item.minimum_stock)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Item</DialogTitle>
            <DialogDescription>
              Preencha as informações do item para adicionar ao inventário.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>SKU</Label>
                    <div className="flex rounded-md overflow-hidden">
                      <Input 
                        value={generatedSku} 
                        readOnly 
                        className="rounded-r-none font-mono"
                      />
                      <Button 
                        type="button" 
                        className="rounded-l-none"
                        onClick={generateSku}
                        disabled={isGeneratingSku}
                      >
                        Gerar
                      </Button>
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("category") === "outro" && (
                    <FormField
                      control={form.control}
                      name="customCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria Personalizada*</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da categoria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="compatibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compatibilidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: iPhone 12, Samsung Galaxy S20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                field.onChange(undefined);
                              } else if (e.target.value.match(/^\d*\.?\d*$/)) {
                                field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                field.onChange(undefined);
                              } else if (e.target.value.match(/^\d*\.?\d*$/)) {
                                field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade em Estoque*</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo*</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNewItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Adicionar Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={editItemDialogOpen} onOpenChange={(open) => {
        setEditItemDialogOpen(open);
        if (!open) {
          // Limpar os estados quando o diálogo for fechado
          setCostPriceInput("");
          setSellingPriceInput("");
          setCurrentItem(null);
          editForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item no inventário.
            </DialogDescription>
          </DialogHeader>
          
          {currentItem && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div>
                    <Label>SKU</Label>
                    <Input value={currentItem.sku} readOnly className="font-mono" />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto*</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {editForm.watch("category") === "outro" && (
                      <FormField
                        control={editForm.control}
                        name="customCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria Personalizada*</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da categoria" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="compatibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compatibilidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: iPhone 12, Samsung Galaxy S20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Custo (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              inputMode="decimal"
                              value={costPriceInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCostPriceInput(value);
                                if (value === "") {
                                  field.onChange(undefined);
                                } else if (value.match(/^\d*\.?\d*$/)) {
                                  field.onChange(value === "" ? undefined : parseFloat(value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Venda (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              inputMode="decimal"
                              value={sellingPriceInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSellingPriceInput(value);
                                if (value === "") {
                                  field.onChange(undefined);
                                } else if (value.match(/^\d*\.?\d*$/)) {
                                  field.onChange(value === "" ? undefined : parseFloat(value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade em Estoque*</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="minimumStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Mínimo*</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditItemDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

export default Inventory;
