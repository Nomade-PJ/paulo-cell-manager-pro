
import React from "react";
import { Button } from "@/components/ui/button";
import { FiscalDocument } from "@/types";
import { toast } from "@/hooks/use-toast";

interface ThermalPrinterProps {
  document: FiscalDocument;
  children?: React.ReactNode;
}

export const ThermalPrinter = ({ document, children }: ThermalPrinterProps) => {
  const printFiscalDocument = () => {
    const receipt = `
      <html>
      <head>
        <title>Comprovante Fiscal</title>
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
          DOCUMENTO FISCAL
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Documento:</span> ${document.number}
        </div>
        <div class="info">
          <span class="bold">Tipo:</span> ${document.type.toUpperCase()}
        </div>
        <div class="info">
          <span class="bold">Data:</span> ${new Date(document.issue_date).toLocaleDateString('pt-BR')}
        </div>
        <div class="info">
          <span class="bold">Status:</span> ${document.status === 'authorized' ? 'Autorizado' : document.status === 'pending' ? 'Pendente' : 'Cancelado'}
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <span class="bold">Cliente:</span> ${document.customer_name}
        </div>
        
        <div class="divider"></div>
        
        ${document.qr_code ? `
        <div style="text-align: center; margin: 10px 0;">
          <img src="${document.qr_code}" style="width: 100px; height: 100px;" />
        </div>
        <div class="divider"></div>
        ` : ''}
        
        <div class="info align-right">
          <span class="bold">Valor Total:</span> R$ ${document.total_value.toFixed(2).replace('.', ',')}
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          Documento emitido eletronicamente
          <br />
          ${document.access_key ? `Chave: ${document.access_key}` : ''}
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
          description: `O documento ${document.number} está sendo impresso.`,
        });
      };
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={printFiscalDocument} 
      className="flex items-center gap-2 w-full justify-start px-2 py-1.5 h-9"
    >
      {children}
    </Button>
  );
};
