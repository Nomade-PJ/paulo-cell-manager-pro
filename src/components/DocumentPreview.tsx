
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Share2, 
  Mail, 
  Phone, 
  MessageSquare,
  FileText 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabaseClient";

interface DocumentPreviewProps {
  type: "nf" | "nfce" | "nfs";
  number: string;
  customerName: string;
  value: number;
  date: Date;
  description?: string;
  accessKey?: string;
  status?: string;
  onPrint?: () => void;
  onShare?: () => void;
  onEmail?: () => void;
}

const DocumentPreview = forwardRef<any, DocumentPreviewProps>(({
  type,
  number,
  customerName,
  value,
  date,
  description,
  accessKey,
  status = "authorized",
  onPrint,
  onShare,
  onEmail
}, ref) => {
  const documentRef = useRef<HTMLDivElement>(null);

  // Expor as funções para o componente pai através da ref
  useImperativeHandle(ref, () => ({
    handlePrint,
    handleEmailSend,
    shareViaWhatsApp,
    shareViaSMS,
    shareViaOther
  }));

  const getDocumentTitle = () => {
    switch (type) {
      case "nf":
        return "NOTA FISCAL ELETRÔNICA";
      case "nfce":
        return "NOTA FISCAL DE CONSUMIDOR ELETRÔNICA";
      case "nfs":
        return "NOTA FISCAL DE SERVIÇO ELETRÔNICA";
      default:
        return "DOCUMENTO FISCAL";
    }
  };

  // Calcular impostos
  const calculateTaxes = () => {
    switch (type) {
      case "nf":
        return {
          icms: value * 0.18,
          ipi: value * 0.05,
          total: value * 0.23
        };
      case "nfce":
        return {
          icms: value * 0.18,
          total: value * 0.18
        };
      case "nfs":
        return {
          iss: value * 0.05,
          total: value * 0.05
        };
      default:
        return { total: 0 };
    }
  };

  // Gerar conteúdo HTML para impressora térmica
  const generateThermalContent = () => {
    const taxes = calculateTaxes();
    
    return `
      <html>
        <head>
          <title>Impressão ${number}</title>
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
          
          <p class="center bold">${getDocumentTitle()}</p>
          <table class="small">
            <tr>
              <td><b>Documento:</b></td>
              <td>${number}</td>
            </tr>
            <tr>
              <td><b>Cliente:</b></td>
              <td>${customerName}</td>
            </tr>
            <tr>
              <td><b>Emissão:</b></td>
              <td>${date.toLocaleString('pt-BR')}</td>
            </tr>
            <tr>
              <td><b>Status:</b></td>
              <td><b>${status === "authorized" ? "NOTA EMITIDA" : status === "draft" ? "RASCUNHO" : "CANCELADA"}</b></td>
            </tr>
          </table>
          
          ${description ? `
          <div class="divider"></div>
          <p class="small"><b>Descrição:</b></p>
          <p class="small break-word">${description}</p>
          ` : ''}
          
          <div class="divider"></div>
          
          <p class="bold">VALORES:</p>
          <table class="small">
            <tr>
              <td>Subtotal:</td>
              <td class="right">${formatCurrency(value)}</td>
            </tr>
            ${type === "nf" ? 
              `<tr>
                <td>ICMS (18%):</td>
                <td class="right">${formatCurrency(taxes.icms)}</td>
              </tr>
              <tr>
                <td>IPI (5%):</td>
                <td class="right">${formatCurrency(taxes.ipi)}</td>
              </tr>` : 
            type === "nfce" ? 
              `<tr>
                <td>ICMS (18%):</td>
                <td class="right">${formatCurrency(taxes.icms)}</td>
              </tr>` : 
            type === "nfs" ? 
              `<tr>
                <td>ISS (5%):</td>
                <td class="right">${formatCurrency(taxes.iss)}</td>
              </tr>` : ''
            }
            <tr class="total">
              <td><b>Total com impostos:</b></td>
              <td class="right"><b>${formatCurrency(value + taxes.total)}</b></td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="center small">
            <p><b>Chave de Acesso:</b></p>
            <p class="break-word">${accessKey || `3525${type.toUpperCase()}0123456789123456789012345678901`}</p>
            <p>Consulte pela chave de acesso em:</p>
            <p><b>www.nfe.fazenda.gov.br</b></p>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;
  };

  // Função para imprimir via impressora térmica
  const handlePrint = async () => {
    if (onPrint) {
      onPrint();
      return;
    }

    try {
      // Gerar conteúdo para impressora térmica
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
        try {
          printWindow.print();
          
          // Registrar o evento de impressão no banco de dados
          if (status === "authorized") {
            registerDocumentEvent('printed');
          }
          
          // Fechar a janela após imprimir
          printWindow.addEventListener('afterprint', () => {
            printWindow.close();
          });
          
          toast({
            title: "Impressão enviada",
            description: "O documento foi enviado para impressão térmica.",
          });
        } catch (printError) {
          console.error("Erro durante a impressão:", printError);
          toast({
            title: "Erro na impressão",
            description: "Ocorreu um erro durante a impressão. Tente novamente.",
            variant: "destructive",
          });
        }
      }, 500);
    } catch (error) {
      console.error("Erro ao preparar impressão:", error);
      toast({
        title: "Erro na impressão",
        description: "Não foi possível preparar o documento para impressão. Verifique se sua impressora está configurada.",
        variant: "destructive",
      });
    }
  };

  // Função para criar e baixar um arquivo PDF
  const handleDownloadThermal = async () => {
    try {
      // Gerar conteúdo HTML para o arquivo
      const content = generateThermalContent();
      
      // Criar um blob com o conteúdo HTML
      const blob = new Blob([content], { type: 'text/html' });
      
      // Criar URL temporária para o blob
      const url = URL.createObjectURL(blob);
      
      // Criar elemento de download
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-${number.replace(/\//g, '-')}.html`;
      
      // Simular clique para iniciar o download
      document.body.appendChild(a);
      a.click();
      
      // Limpar recursos
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Registrar evento de download
      if (status === "authorized") {
        registerDocumentEvent('downloaded');
      }
      
      toast({
        title: "Arquivo gerado",
        description: "O documento foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar arquivo:", error);
      toast({
        title: "Erro ao gerar arquivo",
        description: "Não foi possível gerar o arquivo do documento.",
        variant: "destructive",
      });
    }
  };

  // Função para enviar por e-mail
  const handleEmailSend = () => {
    if (onEmail) {
      onEmail();
      return;
    }

    try {
      // Construir o corpo do e-mail com os detalhes do documento
      const subject = `${getDocumentTitle()} - ${number}`;
      const body = `
        Olá ${customerName},
        
        Segue sua nota fiscal emitida em ${date.toLocaleString('pt-BR')}.
        
        Detalhes do documento:
        - Documento: ${number}
        - Tipo: ${getDocumentTitle()}
        - Valor Total: ${formatCurrency(value + calculateTaxes().total)}
        
        Atenciosamente,
        Paulo Cell
        CNPJ: 42.054.453/0001-40
        Rua: Dr. Paulo Ramos, Bairro: Centro S/n
        Coelho Neto - MA
      `;
      
      // Abrir o cliente de e-mail padrão do usuário
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Registrar evento de email
      if (status === "authorized") {
        registerDocumentEvent('email_sent');
      }
      
      toast({
        title: "E-mail pronto para envio",
        description: "Seu cliente de e-mail foi aberto com o documento anexado.",
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Não foi possível abrir o cliente de e-mail.",
        variant: "destructive",
      });
    }
  };

  // Registrar evento do documento no banco de dados
  const registerDocumentEvent = async (eventType: string) => {
    try {
      await supabase
        .from('fiscal_document_logs')
        .insert([
          {
            document_number: number,
            action: eventType,
            details: {
              document_type: type,
              customer: customerName,
              timestamp: new Date().toISOString()
            }
          }
        ]);
    } catch (error) {
      console.error("Erro ao registrar evento do documento:", error);
    }
  };

  // Função para copiar link para compartilhamento
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link copiado",
          description: "O link do documento foi copiado para a área de transferência.",
        });
      },
      () => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link para a área de transferência.",
          variant: "destructive",
        });
      }
    );
  };

  // Conteúdo para compartilhamento
  const shareContent = () => {
    return `Documento Fiscal ${number} - Paulo Cell - Valor: ${formatCurrency(value + calculateTaxes().total)} - Emitido em: ${date.toLocaleString('pt-BR')}`;
  };

  // Função para compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    const content = shareContent();
    window.open(`https://wa.me/?text=${encodeURIComponent(content)}`, '_blank');
    
    // Registrar evento de compartilhamento
    if (status === "authorized") {
      registerDocumentEvent('shared_whatsapp');
    }
  };

  // Função para compartilhar via SMS
  const shareViaSMS = () => {
    const content = shareContent();
    window.open(`sms:?&body=${encodeURIComponent(content)}`, '_blank');
    
    // Registrar evento de compartilhamento
    if (status === "authorized") {
      registerDocumentEvent('shared_sms');
    }
  };

  // Função para compartilhar via outras redes sociais
  const shareViaOther = () => {
    if (navigator.share) {
      navigator.share({
        title: `${getDocumentTitle()} - ${number}`,
        text: shareContent(),
      }).then(() => {
        // Registrar evento de compartilhamento
        if (status === "authorized") {
          registerDocumentEvent('shared_other');
        }
      }).catch(err => {
        console.error('Erro ao compartilhar:', err);
        copyToClipboard(shareContent());
      });
    } else {
      copyToClipboard(shareContent());
    }
  };

  const taxes = calculateTaxes();

  return (
    <Card className="border border-gray-200 w-full max-w-[400px] mx-auto">
      <CardHeader className="bg-gray-50 text-center border-b border-gray-200 py-3">
        <CardTitle className="text-sm font-bold">{getDocumentTitle()}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {status === "draft" ? "DOCUMENTO EM RASCUNHO" : "DOCUMENTO EMITIDO"}
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3 text-sm">
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-4" ref={documentRef}>
            <div className="space-y-1 text-center">
              <h3 className="font-bold text-base">PAULO CELL</h3>
              <p className="text-xs">CNPJ: 42.054.453/0001-40</p>
              <p className="text-xs">Rua: Dr. Paulo Ramos, Bairro: Centro S/n</p>
              <p className="text-xs">Coelho Neto - MA</p>
            </div>
            
            <div className="border-t border-b border-dashed border-gray-200 py-2 space-y-1">
              <p><span className="font-medium">Documento:</span> {number}</p>
              <p><span className="font-medium">Cliente:</span> {customerName}</p>
              <p><span className="font-medium">Emissão:</span> {date.toLocaleString('pt-BR')}</p>
              <p><span className="font-medium">Status:</span> <span className={`font-medium ${status === "authorized" ? "text-green-600" : "text-yellow-600"}`}>
                {status === "authorized" ? "NOTA EMITIDA" : "RASCUNHO"}
              </span></p>
            </div>
            
            {description && (
              <div className="space-y-1 py-2">
                <p className="font-medium">Descrição:</p>
                <p className="text-xs break-words">{description}</p>
              </div>
            )}
            
            <div className="space-y-1 border-t border-gray-200 pt-2">
              <p className="font-medium">Valores:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <p>Subtotal:</p>
                <p className="text-right">{formatCurrency(value)}</p>
                
                {type === "nf" && (
                  <>
                    <p>ICMS (18%):</p>
                    <p className="text-right">{formatCurrency(taxes.icms)}</p>
                    <p>IPI (5%):</p>
                    <p className="text-right">{formatCurrency(taxes.ipi)}</p>
                  </>
                )}
                
                {type === "nfce" && (
                  <>
                    <p>ICMS (18%):</p>
                    <p className="text-right">{formatCurrency(taxes.icms)}</p>
                  </>
                )}
                
                {type === "nfs" && (
                  <>
                    <p>ISS (5%):</p>
                    <p className="text-right">{formatCurrency(taxes.iss)}</p>
                  </>
                )}
                
                <p className="font-bold">Total com impostos:</p>
                <p className="text-right font-bold">{formatCurrency(value + taxes.total)}</p>
              </div>
            </div>
            
            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-xs">Chave de Acesso:</p>
              <p className="text-xs break-all font-mono">
                {accessKey || `3525${type.toUpperCase()}0123456789123456789012345678901`}
              </p>
              <div className="mt-2 text-xs">
                <p>Consulte pela chave de acesso em:</p>
                <p className="font-medium">www.nfe.fazenda.gov.br</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50 border-t border-gray-200 py-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmailSend}>
          <Mail className="h-4 w-4 mr-1" />
          Email
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Compartilhar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="grid gap-1 p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex justify-start px-2 py-1.5 text-green-600"
                onClick={shareViaWhatsApp}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex justify-start px-2 py-1.5"
                onClick={shareViaSMS}
              >
                <Phone className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex justify-start px-2 py-1.5"
                onClick={handleDownloadThermal}
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar formato térmico
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CardFooter>
    </Card>
  );
});

DocumentPreview.displayName = "DocumentPreview";
export default DocumentPreview;
