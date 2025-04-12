
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NewDocumentDialogProps {
  onDocumentCreated?: () => void;
}

const NewDocumentDialog = ({ onDocumentCreated }: NewDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>("nf");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [totalValue, setTotalValue] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!documentType || !customerName || !totalValue) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real application, this would call an API to create the document
      // For now, we'll just simulate the API call
      
      toast({
        title: "Processando",
        description: "Emitindo documento fiscal...",
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful document creation
      const documentTypeName = documentType === "nf" ? "Nota Fiscal" : 
                              documentType === "nfce" ? "NFCe" : "Nota de Serviço";
      
      toast({
        title: "Documento Emitido",
        description: `${documentTypeName} emitida com sucesso.`,
      });
      
      setOpen(false);
      if (onDocumentCreated) onDocumentCreated();
      
      // Reset form
      setDocumentType("nf");
      setCustomerId("");
      setCustomerName("");
      setTotalValue("0");
    } catch (error) {
      console.error("Error creating document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível emitir o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Emitir Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Emitir Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados para emitir um novo documento fiscal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select
                value={documentType}
                onValueChange={setDocumentType}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nf">Nota Fiscal (NF-e)</SelectItem>
                  <SelectItem value="nfce">Nota Fiscal Consumidor (NFC-e)</SelectItem>
                  <SelectItem value="nfs">Nota Fiscal de Serviço (NFS-e)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Input 
                id="customer"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor Total (R$)</Label>
              <Input 
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm text-muted-foreground">
                {documentType === "nf" && "Para notas fiscais de produtos, é necessário incluir os itens na próxima etapa."}
                {documentType === "nfce" && "Para NFCe, o documento será gerado com QR code para consulta."}
                {documentType === "nfs" && "Para notas de serviço, descreva o serviço na próxima etapa."}
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Emitindo..." : "Emitir Documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
