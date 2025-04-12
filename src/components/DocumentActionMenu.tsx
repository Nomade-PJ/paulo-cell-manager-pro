
import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabaseClient";

interface DocumentActionMenuProps {
  document: FiscalDocument;
  onDocumentUpdated?: () => void;
}

const DocumentActionMenu = ({ document, onDocumentUpdated }: DocumentActionMenuProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Handler for document reissue
  const handleReissue = async () => {
    try {
      // In a real application, this would call an API to reissue the document
      // For now, we'll just show a toast
      toast({
        title: "Reemissão solicitada",
        description: `Documento ${document.number} será reemitido.`,
      });
      
      // Simulate API call
      setTimeout(() => {
        toast({
          title: "Documento reemitido",
          description: `Reemissão do documento ${document.number} concluída.`,
        });
        if (onDocumentUpdated) onDocumentUpdated();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro na reemissão",
        description: "Não foi possível reemitir o documento.",
        variant: "destructive",
      });
      console.error("Error reissuing document:", error);
    }
  };

  // Handler for document cancellation
  const handleCancel = async () => {
    try {
      toast({
        title: "Solicitação de cancelamento",
        description: `Iniciando processo de cancelamento para ${document.number}.`,
      });
      
      // Simulate API call
      setTimeout(() => {
        toast({
          title: "Documento cancelado",
          description: `O documento ${document.number} foi cancelado com sucesso.`,
        });
        if (onDocumentUpdated) onDocumentUpdated();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro no cancelamento",
        description: "Não foi possível cancelar o documento.",
        variant: "destructive",
      });
      console.error("Error canceling document:", error);
    }
  };

  // Handler for document download
  const handleDownloadPDF = () => {
    // In a real application, this would download the actual PDF
    // For demonstration, we'll show a toast and simulate a download
    toast({
      title: "Download iniciado",
      description: `O PDF do documento ${document.number} está sendo baixado.`,
    });

    // Simulate download completion
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = document.pdf_url || '#';
      link.download = `${document.number}.pdf`;
      link.click();
      
      toast({
        title: "Download concluído",
        description: `O PDF do documento ${document.number} foi baixado.`,
      });
    }, 1500);
  };

  // Handler for document details view
  const handleViewDetails = () => {
    setShowDetailsDialog(true);
  };

  // Handler for sending by email
  const handleSendEmail = () => {
    toast({
      title: "Envio por email",
      description: `Preparando envio por email do documento ${document.number}.`,
    });

    // Simulate sending email
    setTimeout(() => {
      toast({
        title: "Email enviado",
        description: `O documento ${document.number} foi enviado por email.`,
      });
    }, 2000);
  };

  return (
    <>
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
              >
                <X className="mr-2 h-4 w-4" />
                <span>Cancelar</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Document Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Documento {document.number}</DialogTitle>
            <DialogDescription>
              Informações completas do documento fiscal
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Informações Gerais</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Número:</span> {document.number}</p>
                  <p><span className="font-medium">Tipo:</span> {document.type.toUpperCase()}</p>
                  <p><span className="font-medium">Status:</span> {document.status === "authorized" ? "Autorizada" : document.status === "pending" ? "Pendente" : "Cancelada"}</p>
                  <p><span className="font-medium">Data Emissão:</span> {new Date(document.issue_date).toLocaleString('pt-BR')}</p>
                  <p><span className="font-medium">Valor Total:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(document.total_value)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Cliente</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Nome:</span> {document.customer_name}</p>
                  <p><span className="font-medium">ID:</span> {document.customer_id}</p>
                </div>
                
                {document.access_key && (
                  <>
                    <h4 className="font-medium mt-4">Informações Fiscais</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="font-medium">Chave de Acesso:</span></p>
                      <p className="break-all">{document.access_key}</p>
                      {document.authorization_date && (
                        <p><span className="font-medium">Data Autorização:</span> {new Date(document.authorization_date).toLocaleString('pt-BR')}</p>
                      )}
                      {document.cancelation_date && (
                        <p><span className="font-medium">Data Cancelamento:</span> {new Date(document.cancelation_date).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {document.qr_code && (
              <div className="border-t pt-4">
                <h4 className="font-medium">QR Code</h4>
                <div className="mt-2 flex justify-center">
                  <img src={document.qr_code} alt="QR Code do Documento" className="max-h-48" />
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => handleDownloadPDF()}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
                
                <Button variant="outline" onClick={() => handleSendEmail()}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar por E-mail
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentActionMenu;
