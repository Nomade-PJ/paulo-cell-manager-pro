import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface ServiceThermalPrinterProps {
  service: any; // Service data structure
  children?: React.ReactNode;
}

export const ServiceThermalPrinter = ({ service, children }: ServiceThermalPrinterProps) => {
  const printServiceReceipt = () => {
    // Prepare formatted data
    const status = {
      pending: "Pendente",
      in_progress: "Em andamento",
      waiting_parts: "Aguardando peças",
      completed: "Concluído",
      delivered: "Entregue"
    };

    const serviceTypes = {
      screen_repair: "Troca de Tela",
      battery_replacement: "Troca de Bateria",
      water_damage: "Dano por Água",
      software_issue: "Problema de Software",
      charging_port: "Porta de Carregamento",
      button_repair: "Reparo de Botões",
      camera_repair: "Reparo de Câmera",
      mic_speaker_repair: "Reparo de Microfone/Alto-falante",
      diagnostics: "Diagnóstico Completo",
      unlocking: "Desbloqueio",
      data_recovery: "Recuperação de Dados",
    };

    const serviceName = service.service_type === 'other' 
      ? service.other_service_description 
      : serviceTypes[service.service_type] || service.service_type;

    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(service.price || 0);
    
    // Formatar as datas
    const createdDate = new Date(service.created_at).toLocaleDateString('pt-BR');
    
    // Formatar data de previsão de entrega se existir
    let estimatedDate = "Não informada";
    if (service.estimated_completion_date) {
      try {
        estimatedDate = new Date(service.estimated_completion_date).toLocaleDateString('pt-BR');
      } catch (error) {
        console.error("Erro ao formatar data de previsão:", error);
      }
    }
    
    // Gerar ID de ordem formatado para exibição
    const orderNumber = service.id ? service.id.substring(0, 8).toUpperCase() : "N/A";
    
    // Processar observações para formatação adequada (quebras de linha, remoção de caracteres especiais)
    const formattedObservations = service.observations 
      ? service.observations
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      : "";

    const receipt = `
      <html>
      <head>
        <title>Comprovante de Serviço</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Arial', sans-serif;
            width: 80mm;
            margin: 0;
            padding: 2mm;
            font-size: 10pt;
            background-color: white;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 12pt;
          }
          .info {
            margin-bottom: 1mm;
            line-height: 1.2;
          }
          .divider {
            border-top: 1px dashed black;
            margin: 2mm 0;
            clear: both;
          }
          .bold {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 2mm;
            font-size: 8pt;
          }
          .align-right {
            text-align: right;
          }
          .observations {
            white-space: pre-wrap;
            font-size: 9pt;
            margin-top: 1mm;
            padding: 1mm;
            border-left: 1px solid black;
            max-width: 100%;
            word-break: break-word;
          }
          .order-number {
            font-weight: bold;
            font-size: 14pt;
            text-align: center;
            margin-bottom: 1mm;
            letter-spacing: 1px;
          }
          .small-text {
            font-size: 8pt;
          }
          .centered {
            text-align: center;
          }
          .qr-placeholder {
            margin: 2mm auto;
            width: 20mm;
            height: 20mm;
            border: 1px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7pt;
            text-align: center;
          }
          /* Otimizações específicas para impressoras térmicas */
          @media print {
            html, body {
              width: 80mm;
              height: auto;
              margin: 0 !important;
              padding: 0 !important;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          PAULO CELL
          <br />
          ORDEM DE SERVIÇO
        </div>
        
        <div class="order-number">OS: ${orderNumber}</div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Cliente:</span> ${service.customers?.name || "Cliente não encontrado"}
        </div>
        <div class="info">
          <span class="bold">Dispositivo:</span> ${service.devices ? `${service.devices.brand} ${service.devices.model}` : "Dispositivo não encontrado"}
        </div>
        <div class="info">
          <span class="bold">Data de Registro:</span> ${createdDate}
        </div>
        <div class="info">
          <span class="bold">Previsão de Entrega:</span> ${estimatedDate}
        </div>
        <div class="info">
          <span class="bold">Status:</span> ${status[service.status] || service.status}
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Serviço:</span> ${serviceName}
        </div>
        
        ${service.observations ? `
        <div class="info">
          <span class="bold">Observações:</span>
          <div class="observations">${formattedObservations}</div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="info align-right">
          <span class="bold">Valor Total:</span> ${price}
        </div>
        
        <div class="divider"></div>
        
        <div class="centered">
          <div class="qr-placeholder">
            OS: ${orderNumber}
          </div>
        </div>
        
        <div class="footer">
          * Comprovante de Serviço *
          <br />
          Sistema Desenvolvido por Nomade-PJ
          <br />
          <span class="small-text">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
      </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const printFrame = window.document.createElement('iframe');
    printFrame.style.display = 'none';
    window.document.body.appendChild(printFrame);
    
    // Access the document of the iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    
    if (frameDoc) {
      frameDoc.write(receipt);
      frameDoc.close();
      
      // Wait for content to load before printing
      printFrame.onload = () => {
        try {
          // Configurar impressão para papel térmico
          const printOptions = {
            scale: 1,
            silent: true  // Omitir diálogo de impressão se suportado
          };
          
          printFrame.contentWindow?.print();
          
          // Remove the iframe after printing
          setTimeout(() => {
            if (window.document.body.contains(printFrame)) {
              window.document.body.removeChild(printFrame);
            }
          }, 1000);
          
          toast({
            title: "Impressão iniciada",
            description: "A ordem de serviço está sendo impressa.",
          });
        } catch (error) {
          console.error("Erro ao imprimir:", error);
          toast({
            variant: "destructive",
            title: "Erro na impressão",
            description: "Não foi possível imprimir o comprovante.",
          });
          
          // Certifique-se de remover o iframe mesmo em caso de erro
          if (window.document.body.contains(printFrame)) {
            window.document.body.removeChild(printFrame);
          }
        }
      };
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={printServiceReceipt} 
      className="flex items-center gap-2 w-full justify-start px-2 py-1.5 h-9"
    >
      {children}
    </Button>
  );
};

export default ServiceThermalPrinter; 