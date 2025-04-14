import React, { useState } from "react";
import { 
  MoreHorizontal, 
  Printer, 
  Download, 
  RefreshCw, 
  X, 
  Eye, 
  Send,
  Trash2 
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
      if (document.status !== 'authorized' && document.status !== 'pending') {
        throw new Error('Apenas documentos autorizados ou pendentes podem ser reemitidos');
      }

      toast({
        title: "Reemissão solicitada",
        description: `Iniciando reemissão do documento ${document.number}...`,
      });

      const now = new Date();
      const timestamp = now.getTime();
      
      // Gerar novo número para o documento
      const seriesNumber = document.type === 'nf' ? '001' : 
                          document.type === 'nfce' ? '002' : '003';
      
      const documentNumber = `${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
      const newNumber = `${document.type.toUpperCase()}-${seriesNumber}-${documentNumber}`;
      
      // Gerar nova chave de acesso (lógica simplificada)
      const uf = '35'; // São Paulo
      const aamm = `${now.getFullYear().toString().substring(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const cnpj = '12345678901234';
      const modelo = document.type === 'nf' ? '55' : document.type === 'nfce' ? '65' : '57';
      const numero = documentNumber.padStart(9, '0');
      const chaveExtra = timestamp.toString().substring(0, 9);
      const dv = '0';
      
      const newAccessKey = `${uf}${aamm}${cnpj}${modelo}${seriesNumber}${numero}${chaveExtra}${dv}`;

      // Preparar objeto para inserção
      const newDocObject = {
        id: crypto.randomUUID(),
        type: document.type,
        customer_id: document.customer_id || 'cliente-padrao',
        customer_name: document.customer_name,
        total_value: document.total_value,
        description: `Reemissão do documento ${document.number}`,
        status: 'authorized', 
        number: newNumber,
        issue_date: now.toISOString(),
        access_key: newAccessKey,
        authorization_date: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      // Inserir na tabela documentos
      const { error } = await supabase
        .from('documentos')
        .insert([newDocObject]);
      
      if (error) {
        console.error("Erro ao reemitir documento:", error);
        throw new Error("Não foi possível reemitir o documento. Verifique se todos os campos obrigatórios estão preenchidos.");
      }

      // Criar notificação sobre a reemissão do documento
      if (user) {
        try {
          await sendDocumentNotification(
            user.id,
            newNumber,
            "Documento reemitido com sucesso",
            document.id
          );
        } catch (notifError) {
          console.error("Erro ao enviar notificação:", notifError);
          // Não interrompe o fluxo em caso de erro na notificação
        }
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

  // Handler for downloading PDF
  const handleDownloadPDF = () => {
    try {
      // Gerar HTML para o documento
      const docHTML = generateDocumentHTML();
      
      // Converter HTML para Blob (simulando um PDF)
      const blob = new Blob([docHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Criar link para download
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `documento_${document.number.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      window.document.body.appendChild(a);
      a.click();
      
      // Limpar
      setTimeout(() => {
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      toast({
        title: "Download iniciado",
        description: `O documento ${document.number} foi preparado para download.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o arquivo para download.",
        variant: "destructive",
      });
    }
  };

  // Gerar HTML do documento para impressão/download
  const generateDocumentHTML = () => {
    const issueDate = new Date(document.issue_date);
    
    // Calcular impostos fictícios
    const taxes = calculateTaxes();
    
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Documento ${document.number}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            background-color: white;
            color: black;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
            width: 100%;
          }
          .small {
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          tr.total {
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 5px;
          }
          .right {
            text-align: right;
          }
          .break-word {
            word-wrap: break-word;
          }
          .logo {
            margin-bottom: 8px;
            font-size: 18px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="logo">PAULO CELL</div>
          <p class="small">CNPJ: 42.054.453/0001-40</p>
          <p class="small">Rua: Dr. Paulo Ramos, Bairro: Centro S/n</p>
          <p class="small">Coelho Neto - MA</p>
        </div>
        
        <div class="divider"></div>
        
        <p class="center bold">${getDocumentTypeLabel().toUpperCase()}</p>
        <table class="small">
          <tr>
            <td><b>Documento:</b></td>
            <td>${document.number}</td>
          </tr>
          <tr>
            <td><b>Cliente:</b></td>
            <td>${document.customer_name}</td>
          </tr>
          <tr>
            <td><b>Emissão:</b></td>
            <td>${issueDate.toLocaleString('pt-BR')}</td>
          </tr>
          <tr>
            <td><b>Status:</b></td>
            <td><b>${document.status === "authorized" ? "AUTORIZADA" : document.status === "pending" ? "PENDENTE" : "CANCELADA"}</b></td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        <p class="bold">VALORES:</p>
        <table class="small">
          <tr>
            <td>Subtotal:</td>
            <td class="right">${formatCurrency(document.total_value)}</td>
          </tr>
          <tr class="total">
            <td><b>Total:</b></td>
            <td class="right"><b>${formatCurrency(document.total_value)}</b></td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        <div class="center small">
          <p><b>Chave de Acesso:</b></p>
          <p class="break-word">${document.access_key || '3525' + document.type.toUpperCase() + '0123456789123456789012345678901'}</p>
          <p>Consulte pela chave de acesso em:</p>
          <p><b>www.nfe.fazenda.gov.br</b></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="center">
          <p><b>DOCUMENTO FISCAL</b></p>
          <p>Obrigado pela preferência!</p>
        </div>
      </body>
    </html>
    `;
  };

  // Função para calcular impostos fictícios
  const calculateTaxes = () => {
    return {
      total: document.total_value * 0.10 // Imposto fictício de 10%
    };
  };

  // Função para formatar valor em moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Obter o rótulo do tipo de documento
  const getDocumentTypeLabel = () => {
    switch (document.type) {
      case "nf":
        return "Nota Fiscal Eletrônica";
      case "nfce":
        return "Nota Fiscal de Consumidor Eletrônica";
      case "nfs":
        return "Nota Fiscal de Serviço";
      default:
        return String(document.type).toUpperCase();
    }
  };

  // Handler for document details view
  const handleViewDetails = () => {
    setShowDetailsDialog(true);
  };

  // Handler for sending by email
  const handleSendEmail = () => {
    try {
      const issueDate = new Date(document.issue_date);
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(document.total_value);
      
      // Preparar o assunto e corpo do e-mail
      const subject = `${document.type.toUpperCase()} ${document.number} - Paulo Cell`;
      const body = `
Olá ${document.customer_name},

Segue abaixo o documento fiscal emitido pela Paulo Cell.

Dados do documento:
- Documento: ${document.number}
- Tipo: ${document.type.toUpperCase()}
- Data de emissão: ${issueDate.toLocaleDateString('pt-BR')}
- Valor total: ${formattedValue}

Atenciosamente,
Paulo Cell
CNPJ: 42.054.453/0001-40
Rua: Dr. Paulo Ramos, Bairro: Centro S/n
Coelho Neto - MA
`;
      
      // Usar o protocolo mailto: para abrir o cliente de e-mail do usuário
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      toast({
        title: "E-mail preparado",
        description: "O cliente de e-mail foi aberto para envio do documento.",
      });
    } catch (error) {
      console.error('Erro ao preparar e-mail:', error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Não foi possível preparar o e-mail. Verifique se o documento possui todas as informações necessárias.",
        variant: "destructive",
      });
    }
  };

  // Handler para exclusão de documento
  const handleDelete = async () => {
    try {
      toast({
        title: "Excluindo documento",
        description: `Iniciando exclusão do documento ${document.number}...`,
      });

      // Excluir da tabela documentos
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', document.id);
      
      if (error) throw error;

      toast({
        title: "Documento excluído",
        description: `O documento ${document.number} foi excluído com sucesso.`,
      });

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (error: any) {
      toast({
        title: "Erro na exclusão",
        description: error.message || "Não foi possível excluir o documento.",
        variant: "destructive",
      });
      console.error("Error deleting document:", error);
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
          
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
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
