
import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ServicePrinterProps {
  service: any;
  customerName: string;
  deviceInfo: string;
}

const ServicePrinter = ({ service, customerName, deviceInfo }: ServicePrinterProps) => {
  const printServiceReceipt = () => {
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
          <span class="bold">Nº:</span> ${service.id.substr(-8).toUpperCase()}
        </div>
        <div class="info">
          <span class="bold">Data:</span> ${new Date(service.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div class="info">
          <span class="bold">Status:</span> ${service.status === 'completed' ? 'Concluído' : 'Pendente'}
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Cliente:</span> ${customerName}
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Dispositivo:</span> ${deviceInfo}
        </div>
        <div class="info">
          <span class="bold">Tipo de serviço:</span> ${service.service_type}
        </div>
        <div class="info">
          <span class="bold">Observações:</span> ${service.observations || '—'}
        </div>
        
        <div class="divider"></div>
        
        <div class="info align-right">
          <span class="bold">Total:</span> R$ ${parseFloat(service.price).toFixed(2).replace('.', ',')}
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          Agradecemos pela preferência!
          <br />
          Paulo Cell - Serviços de qualidade
          <br />
          ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
        </div>
      </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    printFrame.contentDocument?.write(receipt);
    printFrame.contentDocument?.close();
    
    // Wait for content to load before printing
    printFrame.onload = () => {
      printFrame.contentWindow?.print();
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={printServiceReceipt} 
      className="flex items-center gap-2 w-full justify-start"
    >
      <Printer className="h-4 w-4" />
      <span>Imprimir</span>
    </Button>
  );
};

export default ServicePrinter;
