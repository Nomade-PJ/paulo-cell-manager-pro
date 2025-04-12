
import React from "react";
import { 
  MoreHorizontal, 
  Printer, 
  Download, 
  RefreshCw, 
  X, 
  Eye, 
  Send 
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FiscalDocument } from "@/types";
import { ThermalPrinter } from "@/components/ThermalPrinter";
import { toast } from "@/hooks/use-toast";

interface DocumentActionMenuProps {
  document: FiscalDocument;
}

const DocumentActionMenu = ({ document }: DocumentActionMenuProps) => {
  // Handler for document reissue
  const handleReissue = () => {
    toast({
      title: "Reemissão solicitada",
      description: `Documento ${document.number} será reemitido.`,
    });
  };

  // Handler for document cancellation
  const handleCancel = () => {
    toast({
      title: "Solicitação de cancelamento",
      description: `Iniciando processo de cancelamento para ${document.number}.`,
    });
  };

  // Handler for document download
  const handleDownloadPDF = () => {
    toast({
      title: "Download iniciado",
      description: `O PDF do documento ${document.number} está sendo baixado.`,
    });
  };

  // Handler for document details view
  const handleViewDetails = () => {
    toast({
      title: "Detalhes do documento",
      description: `Visualizando detalhes do documento ${document.number}.`,
    });
  };

  // Handler for sending by email
  const handleSendEmail = () => {
    toast({
      title: "Envio por email",
      description: `Preparando envio por email do documento ${document.number}.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          <span>Ver detalhes</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <ThermalPrinter document={document}>
            <Printer className="mr-2 h-4 w-4" />
            <span>Imprimir térmica</span>
          </ThermalPrinter>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          <span>Baixar PDF</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSendEmail} className="cursor-pointer">
          <Send className="mr-2 h-4 w-4" />
          <span>Enviar por email</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {document.status !== "canceled" && (
          <>
            {document.status === "authorized" && (
              <DropdownMenuItem onClick={handleReissue} className="cursor-pointer">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Reemitir</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onClick={handleCancel} 
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={document.status === "canceled"}
            >
              <X className="mr-2 h-4 w-4" />
              <span>Cancelar</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DocumentActionMenu;
