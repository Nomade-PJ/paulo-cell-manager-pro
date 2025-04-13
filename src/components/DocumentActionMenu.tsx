
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, FileText, Send, Printer, RotateCw, X } from 'lucide-react';
import { FiscalDocument } from '@/types';
import { toast } from 'sonner';
import { ThermalPrinter } from '@/components/ThermalPrinter';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import DocumentViewDialog from './DocumentViewDialog';

interface DocumentActionMenuProps {
  document: FiscalDocument;
  onDocumentUpdated?: () => void;
}

const DocumentActionMenu = ({ document, onDocumentUpdated }: DocumentActionMenuProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  
  const handleViewDetails = () => {
    setOpenViewDialog(true);
  };
  
  const handlePrintThermal = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      toast.success("Documento enviado para impressão térmica");
    }, 1500);
  };
  
  const handleDownloadPdf = () => {
    toast({
      title: "Download iniciado",
      description: "O PDF está sendo gerado e será baixado em instantes"
    });
    
    setTimeout(() => {
      // In a real implementation, this would use a real PDF URL
      const pdfUrl = document.pdf_url || "#";
      
      // Create temporary link and trigger download
      if (pdfUrl !== "#") {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${document.number}.pdf`;
        link.click();
      } else {
        // For demo purposes
        toast.success("PDF baixado com sucesso");
      }
    }, 1500);
  };
  
  const handleSendEmail = () => {
    toast({
      title: "Enviando email",
      description: `Enviando documento ${document.number} por email...`
    });
    
    setTimeout(() => {
      toast.success("Email enviado com sucesso!");
    }, 2000);
  };
  
  const handleReissue = async () => {
    try {
      toast({
        title: "Reemitindo documento",
        description: "Aguarde enquanto processamos a reemissão..."
      });
      
      // In a real implementation, this would call a backend API
      setTimeout(() => {
        toast.success("Documento reemitido com sucesso!");
        onDocumentUpdated?.();
      }, 2000);
    } catch (error) {
      console.error("Erro ao reemitir documento:", error);
      toast.error("Falha ao reemitir documento");
    }
  };
  
  const handleCancelConfirm = async () => {
    try {
      // In a real implementation, this would call a backend API
      const { error } = await supabase
        .from('fiscal_documents')
        .update({
          status: 'canceled',
          cancelation_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);
      
      if (error) throw error;
      
      toast.success("Documento cancelado com sucesso");
      setOpenCancelDialog(false);
      onDocumentUpdated?.();
    } catch (error) {
      console.error("Erro ao cancelar documento:", error);
      toast.error("Falha ao cancelar documento");
    }
  };
  
  const isAuthorized = document.status === 'authorized';
  const isCanceled = document.status === 'canceled';
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4 text-green-600" />
            <span>Visualizar Detalhes</span>
          </DropdownMenuItem>
          
          {isAuthorized && (
            <>
              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handlePrintThermal}>
                <Printer className="mr-2 h-4 w-4 text-blue-600" />
                <span>Imprimir Térmica</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleDownloadPdf}>
                <FileText className="mr-2 h-4 w-4 text-blue-600" />
                <span>Baixar PDF</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleSendEmail}>
                <Send className="mr-2 h-4 w-4 text-blue-600" />
                <span>Enviar por Email</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleReissue}>
                <RotateCw className="mr-2 h-4 w-4 text-amber-600" />
                <span>Reemitir</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer flex items-center text-red-600 focus:text-red-600" 
                onClick={() => setOpenCancelDialog(true)}
              >
                <X className="mr-2 h-4 w-4" />
                <span>Cancelar</span>
              </DropdownMenuItem>
            </>
          )}
          
          {isCanceled && (
            <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleReissue}>
              <RotateCw className="mr-2 h-4 w-4 text-amber-600" />
              <span>Reemitir</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Printer component (for thermal printing) */}
      {isPrinting && (
        <ThermalPrinter
          title={`Comprovante - ${document.number}`}
          items={[
            { label: "Cliente", value: document.customer_name },
            { label: "Data", value: new Date(document.issue_date).toLocaleDateString("pt-BR") },
            { label: "Valor Total", value: new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(document.total_value) }
          ]}
          footer={`NFe - Chave de Acesso: ${document.access_key}`}
        />
      )}
      
      {/* Cancel dialog */}
      <AlertDialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a cancelar o documento {document.number}. 
              Esta ação não pode ser desfeita e será comunicada às autoridades fiscais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Desistir</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View document dialog */}
      <DocumentViewDialog 
        open={openViewDialog} 
        onOpenChange={setOpenViewDialog} 
        document={document}
      />
    </>
  );
};

export default DocumentActionMenu;
