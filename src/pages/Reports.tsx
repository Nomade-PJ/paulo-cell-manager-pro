
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { nome: 'Jan', valor: 4000 },
  { nome: 'Fev', valor: 3000 },
  { nome: 'Mar', valor: 2000 },
  { nome: 'Abr', valor: 2780 },
  { nome: 'Mai', valor: 1890 },
  { nome: 'Jun', valor: 2390 },
];

const Reports = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Relatórios" 
        description="Visualize dados e estatísticas do seu negócio"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Serviços por Mês</CardTitle>
            <CardDescription>
              Quantidade de serviços realizados ao longo do ano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="valor" fill="#3b82f6" name="Serviços" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
            <CardDescription>
              Faturamento mensal em reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="valor" fill="#10b981" name="Faturamento (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
