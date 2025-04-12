import { useState } from "react";
import { FileText, FilePlus, Search, Calendar, Download, Printer, Download as DownloadIcon, RefreshCw, X as Cancel, Eye, Filter, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiscalDocument } from "@/types";
import DocumentActionMenu from "@/components/DocumentActionMenu";
import { ThermalPrinter } from "@/components/ThermalPrinter";

const mockDocuments: FiscalDocument[] = [
  {
    id: "1",
    number: "NF-00001",
    type: "nf",
    status: "authorized",
    customer_id: "cus_1",
    customer_name: "Empresa ABC Ltda",
    issue_date: "2025-04-10T10:30:00",
    total_value: 1250.50,
    created_at: "2025-04-10T10:30:00",
    updated_at: "2025-04-10T10:35:00",
    authorization_date: "2025-04-10T10:35:00",
    access_key: "35250410907039000155550010000000011100000017",
  },
  {
    id: "2",
    number: "NFCe-00001",
    type: "nfce",
    status: "authorized",
    customer_id: "cus_2",
    customer_name: "Maria Silva",
    issue_date: "2025-04-11T14:20:00",
    total_value: 189.90,
    created_at: "2025-04-11T14:20:00",
    updated_at: "2025-04-11T14:22:00",
    authorization_date: "2025-04-11T14:22:00",
    access_key: "35250411907039000155650010000000011900000015",
    qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  },
  {
    id: "3",
    number: "NFS-00001",
    type: "nfs",
    status: "pending",
    customer_id: "cus_3",
    customer_name: "João Pereira",
    issue_date: "2025-04-12T09:15:00",
    total_value: 350.00,
    created_at: "2025-04-12T09:15:00",
    updated_at: "2025-04-12T09:15:00",
  },
  {
    id: "4",
    number: "NF-00002",
    type: "nf",
    status: "canceled",
    customer_id: "cus_4",
    customer_name: "Distribuidora XYZ",
    issue_date: "2025-04-08T11:40:00",
    total_value: 3750.75,
    created_at: "2025-04-08T11:40:00",
    updated_at: "2025-04-08T16:30:00",
    authorization_date: "2025-04-08T11:45:00",
    cancelation_date: "2025-04-08T16:30:00",
    access_key: "35250408907039000155550010000000021100000025",
  },
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [currentTab, setCurrentTab] = useState("all");

  const filteredDocuments = mockDocuments.filter((doc) => {
    if (currentTab !== "all" && doc.type !== currentTab) return false;
    
    if (searchTerm && 
        !doc.number.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !doc.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) 
      return false;
    
    if (statusFilter && statusFilter !== "all" && doc.status !== statusFilter) return false;
    
    if (dateFilter && format(new Date(doc.issue_date), "yyyy-MM-dd") !== format(dateFilter, "yyyy-MM-dd")) 
      return false;
    
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authorized":
        return <Badge className="bg-green-500">Autorizada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "canceled":
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "nf":
        return "NF";
      case "nfce":
        return "NFCe";
      case "nfs":
        return "NFS";
      default:
        return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documentos Fiscais"
        description="Gerencie notas fiscais e documentos fiscais eletrônicos."
        actions={
          <Button className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            Emitir Nota
          </Button>
        }
      >
        <FileText className="h-6 w-6" />
      </PageHeader>
      
      <Tabs defaultValue="all" onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="nf">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="nfce">NFCe</TabsTrigger>
          <TabsTrigger value="nfs">NFS</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Documentos Fiscais</CardTitle>
                <CardDescription>Gerencie suas notas fiscais eletrônicas</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="authorized">Autorizada</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                {(searchTerm || statusFilter !== "all" || dateFilter) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setDateFilter(undefined);
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="all" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="nf" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="nfce" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="nfs" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {filteredDocuments.length} de {mockDocuments.length} documentos
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Relatórios
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Controle Fiscal</CardTitle>
          <CardDescription>Informações e alertas sobre seus documentos fiscais</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Certificado Digital</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">Valido até 12/12/2025</span>
              <Badge className="bg-green-500">Ativo</Badge>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Notas Emitidas (Mês)</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">42</span>
              <span className="text-sm text-green-600">+12% que mês anterior</span>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Anotações Fiscais</h3>
            <p className="text-sm text-muted-foreground">Verificar obrigações acessórias até 20/04</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface DocumentsTableProps {
  documents: FiscalDocument[];
  getStatusBadge: (status: string) => JSX.Element;
  getDocumentTypeLabel: (type: string) => string;
  formatCurrency: (value: number) => string;
}

const DocumentsTable = ({ documents, getStatusBadge, getDocumentTypeLabel, formatCurrency }: DocumentsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data Emissão</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length > 0 ? (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.number}</TableCell>
                <TableCell>{getDocumentTypeLabel(doc.type)}</TableCell>
                <TableCell>{doc.customer_name}</TableCell>
                <TableCell>{format(new Date(doc.issue_date), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell>{formatCurrency(doc.total_value)}</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-right">
                  <DocumentActionMenu document={doc} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                Nenhum documento encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Documents;
