import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FilePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabaseClient";

interface NewDocumentDialogProps {
  onDocumentCreated?: () => void;
}

const NewDocumentDialog = ({ onDocumentCreated }: NewDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>("nf");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [totalValue, setTotalValue] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateDocument = () => {
    if (!documentType || !customerName || !totalValue) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const value = parseFloat(totalValue);
    if (isNaN(value) || value <= 0) {
      throw new Error("O valor total deve ser maior que zero.");
    }

    // Validações específicas por tipo de documento
    switch (documentType) {
      case 'nfce':
        if (customerName.trim().length < 3) {
          throw new Error("Nome do cliente inválido para NFC-e.");
        }
        break;
      case 'nf':
        const nameParts = customerName.trim().split(' ');
        if (nameParts.length < 2 || nameParts[0].length < 3 || nameParts[1].length < 2) {
          throw new Error("Nome completo do cliente é obrigatório para NF-e.");
        }
        break;
    }
  };

  // Função para gerar dados fiscais fictícios
  const generateFiscalData = (type: string) => {
    const now = new Date();
    const timestamp = now.getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Gerar número de série baseado no tipo de documento
    const seriesNumber = type === 'nf' ? '001' : 
                         type === 'nfce' ? '002' : '003';
    
    // Gerar número de documento
    const documentNumber = `${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    // Gerar chave de acesso de 44 dígitos (fictícia mas com estrutura válida)
    // Formato: UF(2) + AAMM(4) + CNPJ(14) + MODELO(2) + SÉRIE(3) + NUMERO(9) + CHAVE(9) + DV(1)
    const uf = '35'; // São Paulo
    const aamm = `${now.getFullYear().toString().substring(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const cnpj = '12345678901234';
    const modelo = type === 'nf' ? '55' : type === 'nfce' ? '65' : '57';
    const numero = documentNumber.padStart(9, '0');
    const chaveExtra = timestamp.toString().substring(0, 9);
    const dv = '0'; // Dígito verificador (em produção, seria calculado)
    
    const accessKey = `${uf}${aamm}${cnpj}${modelo}${seriesNumber}${numero}${chaveExtra}${dv}`;
    
    // Retornar objeto com todos os dados fiscais
    return {
      number: `${type.toUpperCase()}-${seriesNumber}-${documentNumber}`,
      series: seriesNumber,
      access_key: accessKey,
      authorization_date: now.toISOString(),
      issue_date: now.toISOString(),
      protocol_number: `${now.getFullYear()}${randomPart}${timestamp.toString().substring(5, 13)}`
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validar dados do documento
      validateDocument();
      
      toast({
        title: "Processando",
        description: "Emitindo documento fiscal...",
      });

      // Gerar dados fiscais fictícios
      const fiscalData = generateFiscalData(documentType);

      // Criar documento fiscal no Supabase
      const { data: document, error: createError } = await supabase
        .from('fiscal_documents')
        .insert([
          {
            type: documentType,
            customer_name: customerName,
            total_value: parseFloat(totalValue),
            status: 'authorized', // Já começa como autorizado, pois é fictício
            issue_date: fiscalData.issue_date,
            number: fiscalData.number,
            series: fiscalData.series,
            authorization_date: fiscalData.authorization_date,
            access_key: fiscalData.access_key,
            protocol_number: fiscalData.protocol_number
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Gerar PDF fictício (em um cenário real seria gerado pelo backend)
      const pdfBlob = new Blob(['Documento fiscal fictício'], { type: 'application/pdf' });
      const pdfFileName = `${documentType.toUpperCase()}_${fiscalData.number.replace(/\D/g, '')}.pdf`;
      
      // Armazenar o PDF fictício no Storage do Supabase
      const { data: pdfData, error: pdfError } = await supabase.storage
        .from('fiscal_documents')
        .upload(`pdfs/${document.id}/${pdfFileName}`, pdfBlob);
      
      if (pdfError) {
        console.error("Erro ao armazenar PDF:", pdfError);
        // Não impede o fluxo, apenas loga o erro
      }

      // Atualizar o documento com o caminho do PDF, se foi armazenado com sucesso
      if (pdfData?.path) {
        const { error: updateError } = await supabase
          .from('fiscal_documents')
          .update({
            pdf_url: pdfData.path
          })
          .eq('id', document.id);
        
        if (updateError) {
          console.error("Erro ao atualizar URL do PDF:", updateError);
        }
      }

      const documentTypeName = documentType === "nf" ? "Nota Fiscal" : 
                              documentType === "nfce" ? "NFCe" : "Nota de Serviço";
      
      toast({
        title: "Documento Emitido",
        description: `${documentTypeName} emitida com sucesso. Número: ${fiscalData.number}`,
      });
      
      setOpen(false);
      if (onDocumentCreated) onDocumentCreated();
      
      // Reset form
      setDocumentType("nf");
      setCustomerId("");
      setCustomerName("");
      setTotalValue("0");

    } catch (error: any) {
      console.error("Error creating document:", error);
      toast({
        title: "Erro na Emissão",
        description: error.message || "Não foi possível emitir o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Emitir Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Emitir Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados para emitir um novo documento fiscal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select
                value={documentType}
                onValueChange={setDocumentType}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nf">Nota Fiscal (NF-e)</SelectItem>
                  <SelectItem value="nfce">Nota Fiscal Consumidor (NFC-e)</SelectItem>
                  <SelectItem value="nfs">Nota Fiscal de Serviço (NFS-e)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Input 
                id="customer"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor Total (R$)</Label>
              <Input 
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm text-muted-foreground">
                Detalhes adicionais
              </Label>
              <p className="text-sm text-muted-foreground">
                {documentType === "nf" && "Nota fiscal eletrônica para empresas e pessoas físicas."}
                {documentType === "nfce" && "Nota fiscal de consumidor para vendas no varejo."}
                {documentType === "nfs" && "Nota fiscal para prestação de serviços."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <em>Nota: Documentos emitidos são fictícios e apenas para demonstração.</em>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Emitindo..." : "Emitir Documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
