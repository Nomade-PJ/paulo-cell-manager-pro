import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlusCircle, Loader2 } from 'lucide-react';

interface DocumentItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EmitDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentCreated: () => void;
}

const EmitDocumentDialog: React.FC<EmitDocumentDialogProps> = ({ open, onOpenChange, onDocumentCreated }) => {
  const [documentType, setDocumentType] = useState<'nf' | 'nfce' | 'nfs'>('nf');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  
  const [items, setItems] = useState<DocumentItem[]>([{
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  }]);
  
  // Load customers on dialog open
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);
  
  // Calculate total values
  const totalValue = items.reduce((sum, item) => sum + item.total_price, 0);
  
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Type casting to match Customer interface
      const typedCustomers = (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        document: customer.document,
        document_type: customer.document_type as "cpf" | "cnpj",
        email: customer.email || '',
        phone: customer.phone || ''
      }));
      
      setCustomerOptions(typedCustomers);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error("Não foi possível carregar a lista de clientes.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleItemChange = (index: number, field: keyof DocumentItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalcular o total_price se quantidade ou preço unitário foi alterado
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : updatedItems[index].unit_price;
      updatedItems[index].total_price = quantity * unitPrice;
    }
    
    setItems(updatedItems);
  };
  
  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      setItems(updatedItems);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast.error("Selecione um cliente para continuar");
      return;
    }
    
    if (items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
      toast.error("Preencha corretamente todos os itens");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const selectedCustomer = customerOptions.find(c => c.id === selectedCustomerId);
      
      if (!selectedCustomer) {
        toast.error("Cliente não encontrado");
        return;
      }
      
      // Simulating a fiscal document creation since we don't have the fiscal_documents table
      // In a real implementation, this would insert into the fiscal_documents table
      toast.success(`${documentType.toUpperCase()} emitida com sucesso!`);
      
      // Simulate successful document creation
      setTimeout(() => {
        onOpenChange(false);
        onDocumentCreated();
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao emitir documento fiscal:', error);
      toast.error(`Falha ao emitir documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Emitir Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados para emissão do documento fiscal
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={(val) => setDocumentType(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nf">Nota Fiscal Eletrônica (NF-e)</SelectItem>
                  <SelectItem value="nfce">Nota Fiscal de Consumidor Eletrônica (NFC-e)</SelectItem>
                  <SelectItem value="nfs">Nota Fiscal de Serviços (NFS-e)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issue-date">Data de Emissão</Label>
              <DatePicker date={issueDate} setDate={setIssueDate} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Clientes</SelectLabel>
                  {customerOptions.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.document && `(${customer.document})`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Itens</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" /> Adicionar Item
              </Button>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md">
                <div className="col-span-5">
                  <Label htmlFor={`item-${index}-desc`} className="text-xs">Descrição</Label>
                  <Input 
                    id={`item-${index}-desc`}
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`item-${index}-qty`} className="text-xs">Qtd</Label>
                  <Input 
                    id={`item-${index}-qty`}
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`item-${index}-price`} className="text-xs">Valor Unit.</Label>
                  <Input 
                    id={`item-${index}-price`}
                    type="number" 
                    value={item.unit_price} 
                    onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Total</Label>
                  <p className="border rounded-md px-3 py-2 text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.total_price)}
                  </p>
                </div>
                <div className="col-span-1">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="w-full"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end mt-4">
              <div className="text-right">
                <Label>Valor Total</Label>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emitindo...
              </>
            ) : (
              'Emitir Documento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmitDocumentDialog;
