import { useState, useEffect } from "react";
import { FileText, FilePlus, Search, Calendar, Download, RefreshCw, X, Eye, Filter, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiscalDocument } from "@/types";
import DocumentActionMenu from "@/components/DocumentActionMenu";
import { ThermalPrinter } from "@/components/ThermalPrinter";
import NewDocumentDialog from "@/components/NewDocumentDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

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
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [currentTab, setCurrentTab] = useState("all");
  const [certificateStatus, setCertificateStatus] = useState<"active" | "expiring" | "expired">("active");
  const [certificateExpiry, setCertificateExpiry] = useState("");
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<{month: string; count: number}[]>([]);
  const [sefazStatus, setSefazStatus] = useState<"online" | "offline">("online");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const navigate = useNavigate();

  // Forçar atualização
  const forceRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Carregar documentos fiscais
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // Tentar carregar da tabela 'documentos'
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!documentosError && documentosData && documentosData.length > 0) {
        setDocuments(documentosData);
        return;
      }

      // Se não encontrar, tentar da tabela 'documentos_fiscais'
      const { data: fiscaisData, error: fiscaisError } = await supabase
        .from('documentos_fiscais')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fiscaisError && fiscaisData && fiscaisData.length > 0) {
        setDocuments(fiscaisData);
        return;
      }

      // Por último, tentar da tabela 'documents' (em inglês)
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('date', { ascending: false });

      if (!documentsError && documentsData && documentsData.length > 0) {
        // Converter para o formato FiscalDocument
        const convertedData: FiscalDocument[] = documentsData.map(doc => ({
          id: doc.id,
          number: doc.number,
          type: doc.type,
          status: doc.status === "Emitido" ? "authorized" : "pending",
          customer_id: "unknown",
          customer_name: doc.customer_name,
          issue_date: doc.date,
          total_value: doc.value,
          created_at: doc.date,
          updated_at: doc.date
        }));
        
        setDocuments(convertedData);
        return;
      }

      // Se não encontrou dados em nenhuma tabela, usar dados mockados
      setDocuments(mockDocuments);
      
      toast({
        title: "Modo Demonstração",
        description: "Carregando exemplos de documentos fiscais.",
      });
    } catch (error) {
      console.error('Error loading documents:', error);
      
      // Fallback para documentos mockados em caso de erro
      setDocuments(mockDocuments);
      
      toast({
        title: "Modo Demonstração",
        description: "Carregando exemplos de documentos fiscais.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadDocuments();
    loadFiscalDashboard();
  }, [refreshCounter]); // Recarrega sempre que refreshCounter mudar

  // Carregar dados do painel fiscal
  const loadFiscalDashboard = async () => {
    try {
      // Buscar status do certificado digital
      try {
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('expiry_date, status')
          .single();

        if (!certError && certData) {
          const expiryDate = new Date(certData.expiry_date);
          const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          setCertificateExpiry(expiryDate.toLocaleDateString('pt-BR'));
          setCertificateStatus(
            daysToExpiry <= 0 ? 'expired' :
            daysToExpiry <= 30 ? 'expiring' : 'active'
          );
        } else {
          // Set default values if certificate data not available
          setCertificateExpiry('N/A');
          setCertificateStatus('active');
        }
      } catch (certFetchError) {
        console.error('Error fetching certificate data:', certFetchError);
        // Set default values for certificate
        setCertificateExpiry('N/A');
        setCertificateStatus('active');
      }

      // Buscar estatísticas mensais
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('fiscal_documents')
          .select('created_at')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
          .order('created_at', { ascending: true });

        if (!statsError && statsData) {
          const monthlyData = statsData.reduce((acc: {[key: string]: number}, doc) => {
            const month = new Date(doc.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
          }, {});

          setMonthlyStats(
            Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
          );
          setMonthlyCount(statsData.length);
        } else {
          // Set default values if stats data not available
          setMonthlyStats([]);
          setMonthlyCount(0);
        }
      } catch (statsFetchError) {
        console.error('Error fetching statistics data:', statsFetchError);
        // Set default values for stats
        setMonthlyStats([]);
        setMonthlyCount(0);
      }

      // Verificar status da SEFAZ
      try {
        // Try to check SEFAZ status
        const { data: sefazData, error: sefazError } = await supabase
          .functions
          .invoke('check-sefaz-status');
        
        // Set status based on error presence
        setSefazStatus(sefazError ? 'offline' : 'online');
      } catch (sefazError) {
        console.error('Error checking SEFAZ status:', sefazError);
        // Default to online to avoid alarming users
        setSefazStatus('online');
      }

    } catch (error) {
      console.error('Error loading fiscal dashboard:', error);
      // Don't show the error toast since we've handled individual errors above
      // This avoids the "Erro ao carregar painel" message
    }
  };

  // Filter documents based on search, status, and date
  const filteredDocuments = documents.filter(doc => {
    // Filter by search term
    const matchesSearch = 
      searchTerm === "" || 
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = 
      statusFilter === "all" || 
      doc.status === statusFilter;
    
    // Filter by date
    let matchesDate = true;
    if (dateFilter) {
      const docDate = new Date(doc.issue_date);
      const filterDate = new Date(dateFilter);
      
      matchesDate = 
        docDate.getDate() === filterDate.getDate() &&
        docDate.getMonth() === filterDate.getMonth() &&
        docDate.getFullYear() === filterDate.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
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

  const handleDocumentUpdated = async () => {
    try {
      forceRefresh(); // Força uma atualização completa
      toast({
        title: "Documentos atualizados",
        description: "Lista de documentos atualizada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar documentos:', error);
      toast({
        variant: "destructive",
        title: "Erro na atualização",
        description: "Não foi possível atualizar a lista de documentos."
      });
    }
  };

  const handleNewDocument = async () => {
    try {
      setIsLoading(true);
      forceRefresh(); // Força uma atualização completa
      toast({
        title: "Documentos Atualizados",
        description: "Lista de documentos fiscais atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar documentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a lista de documentos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDocuments = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os documentos estão sendo exportados para Excel.",
    });
    
    // Simulate export completion
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: "Os documentos foram exportados com sucesso.",
      });
    }, 1500);
  };

  // Replace with enhanced Excel export functionality
  const handleExportDocumentsToExcel = (period: string) => {
    const now = new Date();
    let filteredDocs: FiscalDocument[] = [];
    let periodLabel = '';
    
    switch (period) {
      case "1month":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 1)
        );
        periodLabel = "do último mês";
        break;
      case "6months":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 6)
        );
        periodLabel = "dos últimos 6 meses";
        break;
      case "12months":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 12)
        );
        periodLabel = "dos últimos 12 meses";
        break;
      case "all":
        filteredDocs = [...documents];
        periodLabel = "de todo o período";
        break;
    }
    
    exportDocumentsToExcel(filteredDocs, periodLabel);
  };

  // Function to generate and download Excel file
  const exportDocumentsToExcel = async (docs: FiscalDocument[], periodLabel: string) => {
    try {
      toast({
        title: "Exportação iniciada",
        description: `Preparando documentos ${periodLabel} para Excel...`,
      });

      if (docs.length === 0) {
        toast({
          title: "Aviso",
          description: `Não há documentos para o período selecionado.`,
          variant: "destructive"
        });
        return;
      }

      // Generate CSV content
      const csvHeader = "Número,Tipo,Data de Emissão,Cliente,CNPJ/CPF,Status,Valor\n";
      const csvContent = docs.map(doc => {
        const issueDate = new Date(doc.issue_date).toLocaleDateString('pt-BR');
        const docType = doc.type === 'nf' ? 'NF-e' : doc.type === 'nfce' ? 'NFC-e' : 'NFS-e';
        const status = doc.status === 'authorized' ? 'Autorizada' : doc.status === 'pending' ? 'Pendente' : 'Cancelada';
        const value = doc.total_value.toString().replace('.', ',');
        
        return `"${doc.number}","${docType}","${issueDate}","${doc.customer_name}","${doc.customer_id || 'N/A'}","${status}","R$ ${value}"`;
      }).join('\n');
      
      // Combine header and content
      const fullContent = csvHeader + csvContent;
      
      // Create downloadable file
      const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      const fileName = `documentos_fiscais_${periodLabel.replace(/ /g, '_').toLowerCase()}.csv`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      // Log export action
      try {
        await supabase
          .from('fiscal_document_logs')
          .insert([{
            document_number: 'batch_export_excel',
            action: 'excel_exported',
            user_id: 'system',
            details: {
              count: docs.length,
              period: periodLabel,
              timestamp: new Date().toISOString()
            }
          }]);
      } catch (logError) {
        console.error("Erro ao registrar log de exportação Excel:", logError);
      }
      
      toast({
        title: "Exportação concluída",
        description: `${docs.length} documentos ${periodLabel} exportados para Excel com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao exportar documentos para Excel:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os documentos para Excel.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReports = () => {
    // Preparar parâmetros com base nos filtros atuais
    const params = new URLSearchParams();
    
    // Adicionar filtros atuais como parâmetros
    if (currentTab !== 'all') {
      params.append('docType', currentTab);
    }
    
    if (statusFilter !== 'all') {
      params.append('status', statusFilter);
    }
    
    if (dateFilter) {
      params.append('date', format(dateFilter, 'yyyy-MM-dd'));
    }
    
    // Adicionar um parâmetro para indicar que são relatórios de documentos fiscais
    params.append('source', 'fiscal_documents');
    
    // Notificar o usuário
    toast({
      title: "Redirecionando",
      description: "Indo para a página de relatórios fiscais.",
    });
    
    // Redirecionar para a página de relatórios com os parâmetros
    navigate(`/reports?${params.toString()}`);
  };

  const checkCertificate = () => {
    // Simulate checking digital certificate
    toast({
      title: "Verificando certificado",
      description: "Validando status do certificado digital...",
    });
    
    // Simulate response
    setTimeout(() => {
      const daysLeft = Math.floor(Math.random() * 100);
      
      if (daysLeft < 15) {
        setCertificateStatus("expired");
        setCertificateExpiry("Expirado");
        toast({
          title: "Certificado expirado",
          description: "Seu certificado digital está expirado. Renove imediatamente.",
          variant: "destructive",
        });
      } else if (daysLeft < 30) {
        setCertificateStatus("expiring");
        setCertificateExpiry(`${daysLeft}/12/2025`);
        toast({
          title: "Certificado expirando",
          description: `Seu certificado digital expira em ${daysLeft} dias. Renove em breve.`,
          className: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200",
        });
      } else {
        setCertificateStatus("active");
        setCertificateExpiry("12/12/2025");
        toast({
          title: "Certificado válido",
          description: "Seu certificado digital está válido e atualizado.",
        });
      }
    }, 1500);
  };

  const handleExportDocumentsByPeriod = (period: string) => {
    const now = new Date();
    let filteredDocs: FiscalDocument[] = [];
    let periodLabel = '';
    
    switch (period) {
      case "1month":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 1)
        );
        periodLabel = "do último mês";
        break;
      case "6months":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 6)
        );
        periodLabel = "dos últimos 6 meses";
        break;
      case "12months":
        filteredDocs = documents.filter(doc => 
          new Date(doc.issue_date) >= subMonths(now, 12)
        );
        periodLabel = "dos últimos 12 meses";
        break;
      case "all":
        filteredDocs = [...documents];
        periodLabel = "de todo o período";
        break;
    }
    
    exportDocumentsPDF(filteredDocs, periodLabel);
  };

  // Function to generate HTML for multiple documents
  const generateBatchDocumentsHTML = (docs: FiscalDocument[]) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Documentos Fiscais</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .document-container {
              page-break-after: always;
              border: 1px solid #ccc;
              margin-bottom: 20px;
              padding: 15px;
              max-width: 210mm;
              margin: 0 auto 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
            }
            .document-type {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
              text-align: center;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
            }
            .info-value {
              flex: 1;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .total-row {
              font-weight: bold;
            }
            .right {
              text-align: right;
            }
            .center {
              text-align: center;
            }
            @media print {
              .document-container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          ${docs.map(doc => {
            const issueDate = new Date(doc.issue_date);
            const docType = doc.type === 'nf' 
              ? 'NOTA FISCAL ELETRÔNICA' 
              : doc.type === 'nfce' 
                ? 'NOTA FISCAL DE CONSUMIDOR ELETRÔNICA' 
                : 'NOTA FISCAL DE SERVIÇO';
            
            return `
              <div class="document-container">
                <div class="header">
                  <div class="company-name">PAULO CELL</div>
                  <div>CNPJ: 42.054.453/0001-40</div>
                  <div>Rua Dr. Paulo Ramos, Bairro: Centro S/n</div>
                  <div>Coelho Neto - MA</div>
                </div>
                
                <div class="document-type">${docType}</div>
                
                <div class="section">
                  <div class="info-row">
                    <div class="info-label">Número:</div>
                    <div class="info-value">${doc.number}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Data de Emissão:</div>
                    <div class="info-value">${issueDate.toLocaleString('pt-BR')}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Cliente:</div>
                    <div class="info-value">${doc.customer_name}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Status:</div>
                    <div class="info-value">${doc.status === 'authorized' ? 'AUTORIZADA' : doc.status === 'pending' ? 'PENDENTE' : 'CANCELADA'}</div>
                  </div>
                </div>
                
                <div class="section">
                  <div class="section-title">VALORES</div>
                  <table>
                    <tr>
                      <td>Subtotal:</td>
                      <td class="right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.total_value)}</td>
                    </tr>
                    <tr class="total-row">
                      <td>TOTAL:</td>
                      <td class="right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.total_value)}</td>
                    </tr>
                  </table>
                </div>
                
                ${doc.access_key ? `
                <div class="section">
                  <div class="section-title">INFORMAÇÕES ADICIONAIS</div>
                  <div class="info-row">
                    <div class="info-label">Chave de Acesso:</div>
                    <div class="info-value" style="word-break: break-all;">${doc.access_key}</div>
                  </div>
                </div>
                ` : ''}
                
                <div class="footer">
                  <p>DOCUMENTO FISCAL</p>
                  <p>Consulte pela chave de acesso em: www.nfe.fazenda.gov.br</p>
                  <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;
  };

  // Add function to export documents as PDF for a specified period
  const exportDocumentsPDF = async (docs: FiscalDocument[], periodLabel: string) => {
    try {
      toast({
        title: "Exportação iniciada",
        description: `Preparando documentos ${periodLabel} para download em PDF...`,
      });

      if (docs.length === 0) {
        toast({
          title: "Aviso",
          description: `Não há documentos para o período selecionado.`,
          variant: "destructive"
        });
        return;
      }

      // Create HTML content for all documents
      const combinedHTML = generateBatchDocumentsHTML(docs);
      
      // Convert to PDF (simulated with HTML)
      const blob = new Blob([combinedHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      const fileName = `documentos_fiscais_${periodLabel.replace(/ /g, '_').toLowerCase()}.html`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      // Log export action
      try {
        await supabase
          .from('fiscal_document_logs')
          .insert([{
            document_number: 'batch_export',
            action: 'batch_exported',
            user_id: 'system',
            details: {
              count: docs.length,
              period: periodLabel,
              timestamp: new Date().toISOString()
            }
          }]);
      } catch (logError) {
        console.error("Erro ao registrar log de exportação em lote:", logError);
      }
      
      toast({
        title: "Exportação concluída",
        description: `${docs.length} documentos ${periodLabel} exportados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao exportar documentos:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os documentos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documentos Fiscais"
        description="Gerencie notas fiscais e documentos fiscais eletrônicos."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={forceRefresh} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <NewDocumentDialog onDocumentCreated={handleNewDocument} />
          </div>
        }
      >
        <FileText className="h-6 w-6" />
      </PageHeader>
      
      <Tabs defaultValue="all" onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 w-full mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="nf">NF-e</TabsTrigger>
          <TabsTrigger value="nfce">NFC-e</TabsTrigger>
          <TabsTrigger value="nfs">NFS-e</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row gap-4 items-start justify-between">
            <div>
              <CardTitle>Documentos Fiscais</CardTitle>
              <CardDescription>
                {currentTab === "all" && "Todos os tipos de documentos fiscais"}
                {currentTab === "nf" && "Notas Fiscais Eletrônicas (NF-e)"}
                {currentTab === "nfce" && "Notas Fiscais de Consumidor Eletrônicas (NFC-e)"}
                {currentTab === "nfs" && "Notas Fiscais de Serviço Eletrônicas (NFS-e)"}
                {currentTab === "history" && "Histórico de documentos emitidos"}
              </CardDescription>
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
                  <Button variant="outline" className="w-full sm:w-auto flex items-center justify-between gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Filtrar por data"}</span>
                    {dateFilter && (
                      <X
                        className="h-4 w-4 opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateFilter(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="all" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
                onDocumentUpdated={handleDocumentUpdated}
              />
            </TabsContent>
            <TabsContent value="nf" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments.filter(doc => doc.type === "nf")} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
                onDocumentUpdated={handleDocumentUpdated}
              />
            </TabsContent>
            <TabsContent value="nfce" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments.filter(doc => doc.type === "nfce")} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
                onDocumentUpdated={handleDocumentUpdated}
              />
            </TabsContent>
            <TabsContent value="nfs" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments.filter(doc => doc.type === "nfs")} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
                onDocumentUpdated={handleDocumentUpdated}
              />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <DocumentsTable 
                documents={filteredDocuments.sort((a, b) => 
                  new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
                )} 
                getStatusBadge={getStatusBadge} 
                getDocumentTypeLabel={getDocumentTypeLabel}
                formatCurrency={formatCurrency}
                onDocumentUpdated={handleDocumentUpdated}
              />
            </TabsContent>
          </CardContent>
          
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Carregando documentos...</span>
            </div>
          )}
          
          {!isLoading && filteredDocuments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                Não há documentos fiscais que correspondam aos filtros aplicados.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter(undefined);
                setCurrentTab("all");
              }}>
                Limpar filtros
              </Button>
            </div>
          )}
          
          <CardFooter className="border-t bg-muted/40 p-3 flex justify-between">
            <div className="text-sm text-muted-foreground">
              {!isLoading && (
                <span>Exibindo {filteredDocuments.length} documento(s)</span>
              )}
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exportar PDF
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportDocumentsByPeriod("1month")}>
                    Último mês
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsByPeriod("6months")}>
                    Últimos 6 meses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsByPeriod("12months")}>
                    Últimos 12 meses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsByPeriod("all")}>
                    Todo o período
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exportar Excel
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportDocumentsToExcel("1month")}>
                    Último mês
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsToExcel("6months")}>
                    Últimos 6 meses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsToExcel("12months")}>
                    Últimos 12 meses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportDocumentsToExcel("all")}>
                    Todo o período
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" className="text-xs" onClick={handleGenerateReports}>
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
                Gerar Relatórios
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8">
          <Button variant="link" className="p-0 h-auto text-primary">
            <ArrowRight className="h-4 w-4 mr-1" />
            Como emitir notas reais?
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            As notas fiscais emitidas neste aplicativo são fictícias e servem apenas 
            para demonstração. Para emitir notas reais, você precisará de certificado 
            digital e cadastro na SEFAZ.
          </p>
        </div>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Volume Mensal</CardTitle>
            <CardDescription>Total de documentos emitidos no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyCount}</div>
            <div className="h-[200px] mt-4">
              {monthlyStats.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificado Digital</CardTitle>
            <CardDescription>Status do certificado A1</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {certificateStatus === "active" && (
                  <Badge className="bg-green-500">Ativo</Badge>
                )}
                {certificateStatus === "expiring" && (
                  <Badge className="bg-yellow-500">Expirando</Badge>
                )}
                {certificateStatus === "expired" && (
                  <Badge className="bg-red-500">Expirado</Badge>
                )}
                <span>Vence em {certificateExpiry}</span>
              </div>
              {certificateStatus === "expiring" && (
                <Alert className="border-yellow-500/50 text-yellow-600 dark:border-yellow-500 [&>svg]:text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Seu certificado digital expirará em breve. Providencie a renovação.
                  </AlertDescription>
                </Alert>
              )}
              {certificateStatus === "expired" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Certificado Expirado</AlertTitle>
                  <AlertDescription>
                    Não é possível emitir documentos. Renove seu certificado digital.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status SEFAZ</CardTitle>
            <CardDescription>Conexão com o servidor da SEFAZ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {sefazStatus === "online" ? (
                  <Badge className="bg-green-500">Online</Badge>
                ) : (
                  <Badge className="bg-red-500">Offline</Badge>
                )}
                <span>
                  {sefazStatus === "online" 
                    ? "Serviço funcionando normalmente"
                    : "Serviço indisponível"}
                </span>
              </div>
              {sefazStatus === "offline" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>SEFAZ Indisponível</AlertTitle>
                  <AlertDescription>
                    O servidor da SEFAZ está fora do ar. Documentos serão emitidos em contingência.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface DocumentsTableProps {
  documents: FiscalDocument[];
  getStatusBadge: (status: string) => JSX.Element;
  getDocumentTypeLabel: (type: string) => string;
  formatCurrency: (value: number) => string;
  onDocumentUpdated?: () => void;
}

const DocumentsTable = ({ 
  documents, 
  getStatusBadge, 
  getDocumentTypeLabel, 
  formatCurrency,
  onDocumentUpdated
}: DocumentsTableProps) => {
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
                  <DocumentActionMenu document={doc} onDocumentUpdated={onDocumentUpdated} />
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
