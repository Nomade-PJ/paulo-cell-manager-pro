
import React from 'react';
import { FiscalDocument } from '@/types';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DocumentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: FiscalDocument | null;
}

const DocumentViewDialog: React.FC<DocumentViewDialogProps> = ({ open, onOpenChange, document }) => {
  if (!document) return null;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "nf":
        return "Nota Fiscal Eletrônica";
      case "nfce":
        return "Nota Fiscal de Consumidor Eletrônica";
      case "nfs":
        return "Nota Fiscal de Serviço";
      default:
        return type.toUpperCase();
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authorized":
        return <Badge className="bg-green-500">Autorizada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "canceled":
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Documento</DialogTitle>
          <DialogDescription>
            Visualize as informações completas deste documento fiscal
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold">{getDocumentTypeLabel(document.type)}</h3>
            <p className="text-sm text-muted-foreground">Número: {document.number}</p>
            <div className="mt-2 flex items-center gap-2">
              {getStatusBadge(document.status)}
              <span className="text-sm text-muted-foreground">
                Emitida em {format(new Date(document.issue_date), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <h3 className="text-xl font-bold">{formatCurrency(document.total_value)}</h3>
            {document.access_key && (
              <p className="text-xs text-muted-foreground mt-1">
                Chave de Acesso: {document.access_key}
              </p>
            )}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Cliente</h4>
            <p className="text-base">{document.customer_name}</p>
            <p className="text-sm text-muted-foreground">ID: {document.customer_id}</p>
          </div>
          
          {document.items && document.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Itens</h4>
              <div className="border rounded-md p-2">
                {document.items.map((item, index) => (
                  <div key={item.id} className={`flex justify-between py-2 ${index !== document.items!.length - 1 ? "border-b" : ""}`}>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Data de Autorização</h4>
              <p className="text-base">
                {document.authorization_date 
                  ? format(new Date(document.authorization_date), "dd/MM/yyyy HH:mm")
                  : "Não autorizado"}
              </p>
            </div>
            
            {document.cancelation_date && (
              <div>
                <h4 className="text-sm font-medium">Data de Cancelamento</h4>
                <p className="text-base">
                  {format(new Date(document.cancelation_date), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
          
          {document.qr_code && (
            <div className="flex justify-center">
              <div className="w-40 h-40">
                <img 
                  src={document.qr_code} 
                  alt="QR Code" 
                  className="w-full h-full"
                />
                <p className="text-center text-sm mt-1">QR Code da NFCe</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewDialog;
