import React, { useState, useRef, forwardRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Eye, FileEdit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import DocumentPreview from "./DocumentPreview";
import { useAuth } from "@/contexts/AuthContext";

interface NewDocumentDialogProps {
  onDocumentCreated?: () => void;
}

const getDocumentTitle = (type: string): string => {
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

const NewDocumentDialog = ({ onDocumentCreated }: NewDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<"nf" | "nfce" | "nfs">("nf");
  const [customerName, setCustomerName] = useState<string>("");
  const [totalValue, setTotalValue] = useState<string>("0");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("form");
  const [document, setDocument] = useState<any>(null);
  const documentPreviewRef = useRef<any>(null);
  const { user } = useAuth();

  const validateDocument = () => {
    if (!documentType || !customerName || !totalValue) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const value = parseFloat(totalValue);
    if (isNaN(value) || value <= 0) {
      throw new Error("O valor total deve ser maior que zero.");
    }

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

  const generateFiscalData = (type: string) => {
    const now = new Date();
    const timestamp = now.getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const seriesNumber = type === 'nf' ? '001' : 
                          type === 'nfce' ? '002' : '003';
    
    const documentNumber = `${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    const uf = '35';
    const aamm = `${now.getFullYear().toString().substring(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const cnpj = '12345678901234';
    const modelo = type === 'nf' ? '55' : type === 'nfce' ? '65' : '57';
    const numero = documentNumber.padStart(9, '0');
    const chaveExtra = timestamp.toString().substring(0, 9);
    const dv = '0';
    
    const accessKey = `${uf}${aamm}${cnpj}${modelo}${seriesNumber}${numero}${chaveExtra}${dv}`;
    
    return {
      number: `${type.toUpperCase()}-${seriesNumber}-${documentNumber}`,
      series: seriesNumber,
      access_key: accessKey,
      authorization_date: now.toISOString(),
      issue_date: now.toISOString(),
      protocol_number: `${now.getFullYear()}${randomPart}${timestamp.toString().substring(5, 13)}`
    };
  };

  const getUserOrganizationId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error("Error fetching organization ID:", error);
        return null;
      }
      
      return data.organization_id;
    } catch (error) {
      console.error("Error in getUserOrganizationId:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      validateDocument();
      
      setIsSubmitting(true);

      const fiscalData = generateFiscalData(documentType);
      
      const organizationId = user?.id ? await getUserOrganizationId(user.id) : null;
      
      const documentData = {
        type: documentType,
        number: fiscalData.number,
        customer_name: customerName,
        total_value: parseFloat(totalValue),
        issue_date: fiscalData.issue_date,
        authorization_date: fiscalData.authorization_date,
        status: "authorized",
        access_key: fiscalData.access_key,
        organization_id: organizationId
      };
      
      const { data, error } = await supabase
        .from('fiscal_documents')
        .insert([documentData])
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao salvar documento:", error);
        throw new Error(`Erro ao emitir documento: ${error.message}`);
      }
      
      setDocument(data);
      
      toast({
        title: "Documento emitido",
        description: `${getDocumentTitle(documentType)} emitido com sucesso.`,
      });
      
      setActiveTab("preview");
      
      if (onDocumentCreated) {
        onDocumentCreated();
      }
    } catch (error: any) {
      console.error('Erro ao emitir documento:', error);
      toast({
        title: "Erro ao emitir",
        description: error.message || "Não foi possível emitir o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    try {
      validateDocument();
      setActiveTab("preview");
      
      const fiscalData = generateFiscalData(documentType);
      const previewDoc = {
        type: documentType,
        number: fiscalData.number,
        customer_name: customerName,
        total_value: parseFloat(totalValue),
        description: description,
        issue_date: fiscalData.issue_date,
        authorization_date: fiscalData.authorization_date,
        status: "draft",
        access_key: fiscalData.access_key
      };
      
      setDocument(previewDoc);
    } catch (error: any) {
      toast({
        title: "Atenção",
        description: error.message || "Preencha todos os campos corretamente antes de pré-visualizar.",
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Emitir Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados para emitir um novo documento fiscal.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2 w-[400px] mx-auto">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Formulário
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Pré-visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select
                    value={documentType}
                    onValueChange={(val) => setDocumentType(val as "nf" | "nfce" | "nfs")}
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
                  <Label htmlFor="description">Descrição do {documentType === "nfs" ? "Serviço" : "Produto"}</Label>
                  <Textarea 
                    id="description"
                    placeholder={`Descreva o ${documentType === "nfs" ? "serviço" : "produto"} fornecido`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview}
                  className="flex items-center gap-2 order-1 sm:order-none"
                >
                  <Eye className="h-4 w-4" />
                  Pré-visualizar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Emitindo..." : "Emitir Documento"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4">
              Pré-visualização do documento fiscal. Confira se todos os dados estão corretos antes de emitir.
            </p>
            
            {document && (
              <DocumentPreview 
                ref={documentPreviewRef}
                type={document.type}
                number={document.number}
                customerName={document.customer_name}
                value={document.total_value}
                date={new Date(document.issue_date)}
                description={document.description || description}
                accessKey={document.access_key}
                status={document.status}
              />
            )}
            
            <div className="flex justify-end w-full mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab("form")}
                className="mr-2"
              >
                Voltar ao formulário
              </Button>
              {document?.status === "draft" && (
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isSubmitting ? "Emitindo..." : "Emitir Documento"}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
