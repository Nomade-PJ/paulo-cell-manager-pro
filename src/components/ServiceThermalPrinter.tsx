import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

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

    const receipt = `
      <html>
      <head>
        <title>Comprovante de Serviço</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0;
            padding: 10px;
            font-size: 10pt;
          }
          .header {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12pt;
          }
          .info {
            margin-bottom: 5px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .bold {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 9pt;
          }
          .align-right {
            text-align: right;
          }
          /* Hide useless items for printing */
          @media print {
            html, body {
              width: 80mm;
              height: auto;
              overflow: hidden;
            }
            @page {
              margin: 0;
              size: 80mm auto;
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
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Cliente:</span> ${service.customers?.name || "Cliente não encontrado"}
        </div>
        <div class="info">
          <span class="bold">Dispositivo:</span> ${service.devices ? `${service.devices.brand} ${service.devices.model}` : "Dispositivo não encontrado"}
        </div>
        <div class="info">
          <span class="bold">Data:</span> ${new Date(service.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div class="info">
          <span class="bold">Status:</span> ${status[service.status] || service.status}
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Serviço:</span> ${serviceName}
        </div>
        <div class="info">
          <span class="bold">Descrição:</span> ${service.description || "Sem descrição"}
        </div>
        
        <div class="divider"></div>
        
        <div class="info align-right">
          <span class="bold">Valor Total:</span> ${price}
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          Comprovante de Serviço
          <br />
          Paulo Cell Manager
          <br />
          ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
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
        printFrame.contentWindow?.print();
        // Remove the iframe after printing
        setTimeout(() => {
          window.document.body.removeChild(printFrame);
        }, 1000);
        
        toast({
          title: "Impressão iniciada",
          description: "A ordem de serviço está sendo impressa.",
        });
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