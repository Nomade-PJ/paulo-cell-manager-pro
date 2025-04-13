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
import { useAuth } from "@/contexts/AuthContext";
import { sendDocumentNotification } from "@/lib/notifications";

interface DocumentActionMenuProps {
  document: FiscalDocument;
  onDocumentUpdated?: () => void;
}

const DocumentActionMenu = ({ document, onDocumentUpdated }: DocumentActionMenuProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { user } = useAuth();

  // Handler for document reissue
  const handleReissue = async () => {
    try {
      // Verificar se o documento pode ser reemitido
      if (document.status !== 'authorized') {
        throw new Error('Apenas documentos autorizados podem ser reemitidos');
      }

      toast({
        title: "Reemissão solicitada",
        description: `Iniciando reemissão do documento ${document.number}...`,
      });

      // Gerar um novo número para o documento reemitido
      const now = new Date();
      const timestamp = now.getTime();
      const seriesNumber = document.type === 'nf' ? '001' : 
                          document.type === 'nfce' ? '002' : '003';
      const documentNumber = `${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
      const newNumber = `${document.type.toUpperCase()}-${seriesNumber}-${documentNumber}`;
      
      // Gerar nova chave de acesso
      const uf = '35'; // São Paulo
      const aamm = `${now.getFullYear().toString().substring(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const cnpj = '12345678901234';
      const modelo = document.type === 'nf' ? '55' : document.type === 'nfce' ? '65' : '57';
      const numero = documentNumber.padStart(9, '0');
      const chaveExtra = timestamp.toString().substring(0, 9);
      const dv = '0';
      const newAccessKey = `${uf}${aamm}${cnpj}${modelo}${seriesNumber}${numero}${chaveExtra}${dv}`;

      // Inserir novo documento como reemissão
      const { data, error } = await supabase
        .from('fiscal_documents')
        .insert([
          {
            type: document.type,
            customer_id: document.customer_id,
            customer_name: document.customer_name,
            total_value: document.total_value,
            items: document.items,
            status: 'authorized', // Já emitimos como autorizado
            original_document_id: document.id,
            number: newNumber,
            series: seriesNumber,
            access_key: newAccessKey,
            authorization_date: now.toISOString(),
            issue_date: now.toISOString(),
            protocol_number: `${now.getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${timestamp.toString().substring(5, 13)}`
          }
        ]);

      if (error) throw error;

      // Criar notificação sobre a reemissão do documento
      if (user) {
        await sendDocumentNotification(
          user.id,
          newNumber,
          "Documento reemitido com sucesso",
          document.id
        );
      }

      toast({
        title: "Documento reemitido",
        description: `Nova nota fiscal ${newNumber} gerada com sucesso.`,
      });

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (error: any) {
      toast({
        title: "Erro na reemissão",
        description: error.message || "Não foi possível reemitir o documento.",
        variant: "destructive",
      });
      console.error("Error reissuing document:", error);
    }
  };

  // Handler for document cancellation
  const handleCancel = async () => {
    try {
      // Verificar se o documento pode ser cancelado
      if (document.status !== 'authorized') {
        throw new Error('Apenas documentos autorizados podem ser cancelados');
      }

      // Verificar prazo de cancelamento (simulação)
      const authDate = new Date(document.authorization_date!);
      const now = new Date();
      const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);

      if (document.type === 'nfce' && hoursDiff > 72) {
        throw new Error('NFCe só pode ser cancelada em até 72 horas após a autorização');
      }
      if (document.type === 'nf' && hoursDiff > 720) { // 30 dias
        throw new Error('NF-e só pode ser cancelada em até 30 dias após a autorização');
      }

      toast({
        title: "Solicitação de cancelamento",
        description: `Iniciando processo de cancelamento para ${document.number}...`,
      });

      // Atualizar status para cancelado
      const { error } = await supabase
        .from('fiscal_documents')
        .update({
          status: 'canceled',
          cancelation_date: new Date().toISOString(),
          cancelation_reason: 'Cancelamento solicitado pelo emissor',
          protocol_number_cancellation: `CANC${new Date().getTime().toString().substring(0, 10)}`
        })
        .eq('id', document.id);

      if (error) throw error;

      // Criar notificação sobre o cancelamento do documento
      if (user) {
        await sendDocumentNotification(
          user.id,
          document.number,
          "Documento cancelado com sucesso",
          document.id
        );
      }

      toast({
        title: "Documento cancelado",
        description: `O documento ${document.number} foi cancelado com sucesso.`,
      });

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (error: any) {
      toast({
        title: "Erro no cancelamento",
        description: error.message || "Não foi possível cancelar o documento.",
        variant: "destructive",
      });
      console.error("Error canceling document:", error);
    }
  };

  // Handler for document download
  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Download iniciado",
        description: `Gerando PDF do documento ${document.number}...`,
      });

      // Gerar um PDF fictício simples no cliente
      const docType = document.type.toUpperCase();
      const docTitle = document.type === 'nf' ? 'NOTA FISCAL ELETRÔNICA' : 
                      document.type === 'nfce' ? 'NOTA FISCAL DE CONSUMIDOR ELETRÔNICA' : 
                      'NOTA FISCAL DE SERVIÇO ELETRÔNICA';
      
      // Estrutura básica do PDF em HTML
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${document.number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 20px; }
            .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .info-label { font-weight: bold; margin-right: 10px; }
            .info-row { margin-bottom: 8px; }
            .section { margin-bottom: 20px; }
            .document-title { text-align: center; font-size: 22px; font-weight: bold; margin: 30px 0; }
            .footer { margin-top: 40px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PAULO CELL SISTEMA</h1>
            <p>CNPJ: 12.345.678/0001-99</p>
          </div>
          
          <div class="document-title">${docTitle}</div>
          
          <div class="section">
            <div class="info-row">
              <span class="info-label">Número:</span> ${document.number}
            </div>
            <div class="info-row">
              <span class="info-label">Data de Emissão:</span> ${new Date(document.issue_date).toLocaleDateString('pt-BR')}
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span> ${document.status === 'authorized' ? 'AUTORIZADA' : document.status.toUpperCase()}
            </div>
            <div class="info-row">
              <span class="info-label">Chave de Acesso:</span> ${document.access_key}
            </div>
          </div>
          
          <div class="section">
            <div class="info-row">
              <span class="info-label">Cliente:</span> ${document.customer_name}
            </div>
            <div class="info-row">
              <span class="info-label">Valor Total:</span> R$ ${Number(document.total_value).toFixed(2).replace('.', ',')}
            </div>
          </div>
          
          <div class="footer">
            <p>Documento fiscal emitido por Sistema Paulo Cell - versão 1.0.0</p>
            <p>Documento emitido em ambiente de homologação - SEM VALOR FISCAL</p>
          </div>
        </body>
        </html>
      `;
      
      // Converter o HTML para Blob
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      try {
        // Criar elemento de download
        const downloadLink = window.document.createElement('a');
        downloadLink.style.display = 'none';
        downloadLink.href = url;
        downloadLink.setAttribute('download', `${document.number}.html`);
        
        // Adicionar ao DOM
        window.document.body.appendChild(downloadLink);
        
        // Iniciar download
        downloadLink.click();
        
        // Aguardar um pequeno intervalo antes de remover o elemento
        setTimeout(() => {
          if (window.document.body.contains(downloadLink)) {
            window.document.body.removeChild(downloadLink);
          }
        }, 100);
      } finally {
        // Revogar a URL do blob após um tempo para garantir que o download foi iniciado
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 200);
      }
      
      toast({
        title: "Download concluído",
        description: `O documento ${document.number} foi baixado.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no download",
        description: error.message || "Não foi possível baixar o documento.",
        variant: "destructive",
      });
      console.error("Error downloading document:", error);
    }
  };

  // Handler for document details view
  const handleViewDetails = () => {
    setShowDetailsDialog(true);
  };

  // Handler for sending by email
  const handleSendEmail = async () => {
    try {
      toast({
        title: "Envio por email",
        description: `Preparando envio do documento ${document.number}...`,
      });

      // Simular o envio do email (sem chamar API externa)
      // Apenas delay para simular o processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Notificação de sucesso
      toast({
        title: "Email enviado",
        description: `O documento ${document.number} foi enviado por email com sucesso.`,
      });
      
      // Gravar o log de envio no banco
      const { error } = await supabase
        .from('fiscal_document_logs')
        .insert([
          {
            document_id: document.id,
            action: 'email_sent',
            user_id: user?.id,
            details: {
              sent_at: new Date().toISOString(),
              document_number: document.number,
              recipient: 'cliente@exemplo.com' // Em produção, usaria o email real do cliente
            }
          }
        ]);
      
      if (error) {
        console.error("Erro ao registrar log de envio:", error);
      }
      
      // Criar notificação sobre o envio do documento
      if (user) {
        await sendDocumentNotification(
          user.id,
          document.number,
          "Documento enviado por email",
          document.id
        );
      }
    } catch (error: any) {
      toast({
        title: "Erro no envio",
        description: error.message || "Não foi possível enviar o documento por email.",
        variant: "destructive",
      });
      console.error("Error sending email:", error);
    }
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
