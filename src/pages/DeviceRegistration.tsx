
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Smartphone, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const deviceFormSchema = z.object({
  clientName: z.string(),
  deviceType: z.enum(["smartphone", "notebook", "tablet"]),
  brand: z.string().min(1, { message: "Selecione uma marca" }),
  model: z.string().min(1, { message: "Informe o modelo" }),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
  color: z.string().optional(),
  condition: z.enum(["good", "minor_issues", "critical_issues"]),
  passwordType: z.enum(["none", "pin", "pattern", "password"]),
  password: z.string().optional(),
  observations: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

// Brands list
const PHONE_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Motorola", "LG", "Huawei", "Nokia", 
  "Sony", "Google", "OnePlus", "ASUS", "Lenovo", "Acer", "HTC", 
  "BlackBerry", "Alcatel", "ZTE", "Oppo", "Vivo", "Realme", "Tecno", 
  "Infinix", "TCL", "Honor", "Meizu", "Nubia", "Nothing", "Outros"
];

const DeviceRegistration = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      clientName: "",
      deviceType: "smartphone",
      brand: "",
      model: "",
      serialNumber: "",
      imei: "",
      color: "",
      condition: "good",
      passwordType: "none",
      password: "",
      observations: "",
    },
  });
  
  // Fetch client data from localStorage (in a real app, this would be from your API)
  useEffect(() => {
    const storedData = localStorage.getItem("registrationClient");
    if (!storedData) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados do cliente não encontrados. Por favor, reinicie o processo.",
      });
      navigate("/user-registration");
      return;
    }
    
    const client = JSON.parse(storedData);
    setClientData(client);
    form.setValue("clientName", client.name);
  }, [navigate, form]);
  
  // Show password field only if the password type requires it
  const shouldShowPasswordField = form.watch("passwordType") !== "none";
  
  const onSubmit = async (data: DeviceFormValues) => {
    setIsLoading(true);
    
    // In a real app, you would save this to your database
    const deviceId = Math.random().toString(36).substring(2, 11);
    
    // For now, we'll use localStorage to simulate persistence between steps
    localStorage.setItem("registrationDevice", JSON.stringify({
      id: deviceId,
      clientId,
      ...data
    }));
    
    toast({
      title: "Dispositivo registrado com sucesso",
      description: "Você será redirecionado para cadastrar o serviço.",
    });
    
    // Navigate to the next step with client ID and device ID
    navigate(`/service-registration/${clientId}/${deviceId}`);
    setIsLoading(false);
  };
  
  const goBack = () => {
    navigate("/user-registration");
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cadastro de Dispositivo" 
        description="Preencha os detalhes do dispositivo."
      >
        <Smartphone className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={goBack} size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar para dados do cliente
          </Button>
        </div>
        
        {clientData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Informações do Proprietário</h2>
                
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold">Detalhes do Dispositivo</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Dispositivo*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="smartphone">Smartphone</SelectItem>
                            <SelectItem value="notebook">Notebook</SelectItem>
                            <SelectItem value="tablet">Tablet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PHONE_BRANDS.map((brand) => (
                              <SelectItem key={brand} value={brand.toLowerCase()}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo*</FormLabel>
                        <FormControl>
                          <Input placeholder="Modelo do dispositivo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input placeholder="Cor do dispositivo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI</FormLabel>
                        <FormControl>
                          <Input placeholder="IMEI do dispositivo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição do Aparelho*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="good">Bom estado</SelectItem>
                            <SelectItem value="minor_issues">Problemas leves</SelectItem>
                            <SelectItem value="critical_issues">Problemas críticos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="passwordType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Senha</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de senha" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            <SelectItem value="pin">PIN</SelectItem>
                            <SelectItem value="pattern">Padrão</SelectItem>
                            <SelectItem value="password">Senha normal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {shouldShowPasswordField && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Dispositivo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              form.watch("passwordType") === "pattern" 
                                ? "Desenho do padrão (ex: L, Z, etc)" 
                                : "Senha do dispositivo"
                            } 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre o dispositivo..." 
                          className="min-h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack}>
                  Voltar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Carregando..." : "Próximo"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default DeviceRegistration;
