
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

const Documents = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Documentos"
        description="Gerenciar documentos e arquivos do sistema."
      >
        <FileText className="h-6 w-6" />
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>Lista de documentos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Esta seção está em desenvolvimento. Em breve você poderá gerenciar seus documentos aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
