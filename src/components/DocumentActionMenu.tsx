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

  // Handler para reemissão de documento
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

      // Registrar log da reemissão
      await supabase
        .from('fiscal_document_logs')
        .insert([{
          document_number: newNumber,
          action: 'reissued',
          user_id: user?.id,
          details: {
            original_document: document.number,
            timestamp: now.toISOString()
          }
        }]);
      
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

  // Handler para cancelamento de documento
  const handleCancel = async () => {
    try {
      // Verificar se o documento pode ser cancelado
      if (document.status !== 'authorized') {
        throw new Error('Apenas documentos autorizados podem ser cancelados');
      }

      // Verificar prazo de cancelamento
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

      // Atualizar apenas o status e updated_at (removendo cancelation_date)
      const { error: docError } = await supabase
        .from('documentos')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (docError) {
        console.error("Erro ao cancelar documento:", docError);
        throw new Error(`Erro ao atualizar status do documento: ${docError.message}`);
      }

      // Registrar log do cancelamento
      try {
        await supabase
          .from('fiscal_document_logs')
          .insert([{
            document_number: document.number,
            action: 'canceled',
            user_id: user?.id,
            details: {
              cancelation_date: new Date().toISOString(),
              reason: 'Cancelamento solicitado pelo emissor'
            }
          }]);
      } catch (logError) {
        console.warn("Erro ao registrar log de cancelamento:", logError);
        // Continuar mesmo com erro no log
      }

      // Tentar criar notificação sobre o cancelamento do documento - com try/catch
      if (user) {
        try {
          await sendDocumentNotification(
            user.id,
            document.number,
            "Documento cancelado com sucesso",
            document.id
          );
        } catch (notifError) {
          console.warn("Erro ao enviar notificação de cancelamento:", notifError);
          // Não interromper o fluxo em caso de erro na notificação
        }
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

  // Função para copiar texto para a área de transferência
  const copyToClipboard = async () => {
    try {
      const textContent = `
Documento: ${document.type.toUpperCase()} ${document.number}
Emissão: ${new Date(document.issue_date).toLocaleDateString('pt-BR')}
Cliente: ${document.customer_name || 'N/A'}
CNPJ: ${document.customer_id || 'N/A'}
Status: ${document.status === 'authorized' ? 'Autorizada' : document.status === 'pending' ? 'Pendente' : 'Cancelada'}
Valor: ${formatCurrency(document.total_value)}
      `.trim();

      await navigator.clipboard.writeText(textContent);
      
      // Registrar ação de cópia para área de transferência
      await supabase
        .from('fiscal_document_logs')
        .insert([{
          document_number: document.number,
          action: 'copy_clipboard',
          user_id: user?.id,
        }]);
      
      toast({
        title: 'Sucesso',
        description: 'Dados copiados para a área de transferência',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao copiar para área de transferência:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar os dados',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Handler para download do documento PDF
  const handleDownloadPDF = async () => {
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
      
      // Registrar log do download
      if (user) {
        try {
          await supabase
            .from('fiscal_document_logs')
            .insert([{
              document_number: document.number,
              action: 'downloaded',
              user_id: user.id,
              details: {
                format: 'pdf',
                timestamp: new Date().toISOString()
              }
            }]);
        } catch (logError) {
          console.warn("Erro ao registrar log de download:", logError);
        }
      }
      
      toast({
        title: "Download concluído",
        description: `O documento ${document.number} foi baixado.`,
      });
    } catch (error: any) {
      console.error("Erro ao gerar download:", error);
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

  // Handler para visualização de detalhes do documento
  const handleViewDetails = () => {
    setShowDetailsDialog(true);
  };

  // Handler para envio por email
  const handleSendEmail = async () => {
    try {
      // Verificar se o documento tem todas as informações necessárias
      if (!document || !document.number || !document.type || !document.issue_date) {
        throw new Error("Documento sem informações completas");
      }

      // Verificar o cliente, assumir um valor de "Cliente" se estiver em branco
      const customerName = document.customer_name || "Cliente";
      
      // Verificar a data de emissão e formatá-la
      let formattedDate;
      try {
        formattedDate = new Date(document.issue_date).toLocaleDateString('pt-BR');
      } catch (err) {
        console.warn("Erro ao formatar data:", err);
        formattedDate = "Data não disponível";
      }
      
      // Garantir que o valor total existe, ou usar 0 como fallback
      const docValue = document.total_value || 0;
      
      // Construir o corpo do e-mail com os detalhes do documento
      const docTitle = document.type === 'nf' ? 'NOTA FISCAL ELETRÔNICA' : 
                      document.type === 'nfce' ? 'NOTA FISCAL DE CONSUMIDOR ELETRÔNICA' : 
                      'NOTA FISCAL DE SERVIÇO ELETRÔNICA';
                      
      const subject = `${docTitle} - ${document.number}`;
      const body = `
Olá ${customerName},
        
Segue a nota fiscal ${document.number} emitida em ${formattedDate}.
        
Detalhes do documento:
- Documento: ${document.number}
- Tipo: ${docTitle}
- Valor Total: ${formatCurrency(docValue)}
        
Atenciosamente,
Paulo Cell
CNPJ: 42.054.453/0001-40
Rua: Dr. Paulo Ramos, Bairro: Centro S/n
Coelho Neto - MA
`;
      
      // Abrir o cliente de e-mail padrão do usuário - usando try/catch para garantir que mesmo se houver erro no log, o email será enviado
      try {
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Mostrar a mensagem de sucesso primeiro
        toast({
          title: "Email preparado",
          description: "O seu cliente de email foi aberto para envio do documento.",
        });
        
        // Depois tentar registrar o log (não interrompe o fluxo se falhar)
        if (user) {
          try {
            await supabase
              .from('fiscal_document_logs')
              .insert([{
                document_number: document.number,
                action: 'email_sent',
                user_id: user.id,
                details: {
                  sent_at: new Date().toISOString(),
                  document_type: document.type
                }
              }]);
              
            // Criar notificação sobre o envio do documento
            await sendDocumentNotification(
              user.id,
              document.number,
              "Documento enviado por email",
              document.id
            );
          } catch (logError) {
            // Apenas registrar o erro no console, não afetar o usuário
            console.warn("Erro ao registrar log de email:", logError);
          }
        }
      } catch (mailError) {
        console.error("Erro ao abrir cliente de email:", mailError);
        throw new Error("Não foi possível abrir seu cliente de email");
      }
    } catch (error: any) {
      console.error("Erro completo ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || "Não foi possível preparar o e-mail. Verifique se o documento possui todas as informações necessárias.",
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

  // Função para imprimir documento via impressora térmica
  const printDocument = async () => {
    try {
      // Gerar conteúdo térmico
      const content = generateThermalContent();
      
      // Criar um elemento temporário para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error("Não foi possível abrir a janela de impressão");
      }
      
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      
      // Esperar o documento carregar completamente
      setTimeout(() => {
        printWindow.print();
        
        // Fechar a janela após imprimir
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });
        
        // Registrar log da impressão
        registerPrintLog();
        
        toast({
          title: "Impressão enviada",
          description: "O documento foi enviado para impressão térmica.",
        });
      }, 500);
    } catch (error: any) {
      toast({
        title: "Erro na impressão",
        description: error.message || "Não foi possível imprimir o documento.",
        variant: "destructive",
      });
      console.error("Error printing document:", error);
    }
  };

  // Registrar log de impressão
  const registerPrintLog = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('fiscal_document_logs')
        .insert([{
          document_number: document.number,
          action: 'printed',
          user_id: user.id,
          details: {
            print_type: 'thermal',
            timestamp: new Date().toISOString()
          }
        }]);
    } catch (error) {
      console.error("Erro ao registrar log de impressão:", error);
    }
  };

  // Gerar conteúdo HTML para impressora térmica
  const generateThermalContent = () => {
    return `
      <html>
      <head>
        <title>Impressão ${document.number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            background-color: white;
            color: black;
            font-size: 10pt;
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
            font-size: 9pt;
          }
          .header {
            margin-bottom: 10px;
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
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
          .break-all {
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="header">
          PAULO CELL
        </div>
        <div class="center small">
          CNPJ: 42.054.453/0001-40<br>
          Rua: Dr. Paulo Ramos, Centro S/n<br>
          Coelho Neto - MA
        </div>
        
        <div class="divider"></div>
        
        <div class="center bold">
          ${document.type === 'nf' ? 'NOTA FISCAL ELETRÔNICA' : 
            document.type === 'nfce' ? 'NOTA FISCAL CONSUMIDOR' : 'NOTA FISCAL SERVIÇO'}
        </div>
        
        <div class="divider"></div>
        
        <table>
          <tr>
            <td class="bold">Número:</td>
            <td>${document.number}</td>
          </tr>
          <tr>
            <td class="bold">Cliente:</td>
            <td>${document.customer_name}</td>
          </tr>
          <tr>
            <td class="bold">Emissão:</td>
            <td>${new Date(document.issue_date).toLocaleDateString('pt-BR')}</td>
          </tr>
          <tr>
            <td class="bold">Status:</td>
            <td>${document.status === 'authorized' ? 'AUTORIZADO' : 
                document.status === 'canceled' ? 'CANCELADO' : 'PENDENTE'}</td>
          </tr>
          <tr>
            <td class="bold">Valor:</td>
            <td>R$ ${document.total_value.toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        ${document.access_key ? `
        <div class="small">
          <p class="bold">Chave de Acesso:</p>
          <p class="break-all">${document.access_key}</p>
        </div>
        <div class="divider"></div>
        ` : ''}
        
        <div class="center small">
          Documento emitido em ${new Date(document.created_at || document.issue_date).toLocaleString('pt-BR')}
          <br><br>
          Obrigado pela preferência!
        </div>
      </body>
      </html>
    `;
  };

  // Função para criar e compartilhar arquivo para impressão térmica
  const createAndShareThermalFile = async () => {
    try {
      // Criando conteúdo formatado para impressora térmica (largura reduzida)
      const docType = document.type.toUpperCase();
      const docTitle = document.type === 'nf' ? 'NF-e' : 
                     document.type === 'nfce' ? 'NFC-e' : 'NFS-e';
      
      // Conteúdo otimizado para impressora térmica (largura típica de 80mm/58mm)
      const thermalContent = `
PAULO CELL
CNPJ: 42.054.453/0001-40
Rua: Dr. Paulo Ramos, Centro S/n
Coelho Neto - MA

--------------------------------
${docTitle} - ${document.number}
--------------------------------
Cliente: ${document.customer_name || 'Consumidor Final'}
Emissão: ${new Date(document.issue_date).toLocaleDateString('pt-BR')}
          ${new Date(document.issue_date).toLocaleTimeString('pt-BR')}
Status: ${document.status === 'authorized' ? 'AUTORIZADA' : document.status.toUpperCase()}

VALORES:
Subtotal: ${formatCurrency(document.total_value)}
TOTAL:    ${formatCurrency(document.total_value)}
--------------------------------

CHAVE DE ACESSO:
${document.access_key || ''}

Consulte pela chave de acesso em:
www.nfe.fazenda.gov.br

--------------------------------
DOCUMENTO FISCAL
Obrigado pela preferência!
`;

      // Criar arquivo de texto para impressão
      const file = new Blob([thermalContent], { type: 'text/plain' });
      const fileUrl = URL.createObjectURL(file);
      
      // Verificar se o navegador suporta Web Share API
      if (navigator.share) {
        try {
          // Tentar compartilhar o arquivo (principalmente para dispositivos móveis)
          await navigator.share({
            title: `${docTitle} ${document.number}`,
            text: 'Arquivo para impressão térmica',
            files: [new File([file], `thermal_${document.number.replace(/\//g, '_')}.txt`, { type: 'text/plain' })]
          });
          // Registrar ação de compartilhamento
          await supabase
            .from('fiscal_document_logs')
            .insert([{
              document_number: document.number,
              action: 'share_thermal',
              user_id: user?.id,
            }]);
          return;
        } catch (shareError) {
          console.log('Compartilhamento não suportado ou cancelado pelo usuário', shareError);
          // Fallback para download quando o compartilhamento falha
        }
      }

      // Fallback: fazer download do arquivo se não for possível compartilhar
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `thermal_${document.number.replace(/\//g, '_')}.txt`);
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);

      // Registrar ação de download
      await supabase
        .from('fiscal_document_logs')
        .insert([{
          document_number: document.number,
          action: 'download_thermal',
          user_id: user?.id,
        }]);
    } catch (error) {
      console.error('Erro ao criar arquivo para impressão térmica:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o arquivo para impressão térmica.',
        variant: 'destructive',
        duration: 5000,
      });
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
          
          <DropdownMenuItem onClick={printDocument} className="cursor-pointer">
            <Printer className="mr-2 h-4 w-4" />
            <span>Imprimir térmica</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            <span>Baixar PDF</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSendEmail} className="cursor-pointer">
            <Send className="mr-2 h-4 w-4" />
            <span>Enviar por email</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={createAndShareThermalFile} className="cursor-pointer">
            <Printer className="mr-2 h-4 w-4" />
            <span>Imprimir térmica</span>
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
                  <p><span className="font-medium">ID:</span> {document.customer_id || "N/A"}</p>
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
                <Button variant="outline" onClick={printDocument}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
                
                <Button variant="outline" onClick={handleSendEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email
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
