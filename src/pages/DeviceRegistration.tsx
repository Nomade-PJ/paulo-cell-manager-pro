
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
import { supabase } from "@/integrations/supabaseClient";
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
  const { clientId, deviceId } = useParams<{ clientId: string, deviceId?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
  
  useEffect(() => {
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do cliente não encontrado",
      });
      navigate("/user-registration");
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch client data
        const { data: clientData, error: clientError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (clientError) throw clientError;
        
        setClientData(clientData);
        form.setValue("clientName", clientData.name);
        
        // Check if we're editing an existing device
        if (deviceId) {
          setIsEditing(true);
          const { data: deviceData, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .single();
            
          if (deviceError) throw deviceError;
          
          // Fill form with device data
          form.setValue("deviceType", deviceData.device_type || "smartphone");
          form.setValue("brand", deviceData.brand);
          form.setValue("model", deviceData.model);
          form.setValue("serialNumber", deviceData.serial_number || "");
          form.setValue("imei", deviceData.imei || "");
          form.setValue("color", deviceData.color || "");
          form.setValue("condition", deviceData.condition);
          form.setValue("passwordType", deviceData.password_type || "none");
          form.setValue("password", deviceData.password || "");
          form.setValue("observations", deviceData.observations || "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do cliente ou dispositivo.",
        });
        navigate("/clients");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, deviceId, form, navigate]);

  // Show password field only if the password type requires it
  const shouldShowPasswordField = form.watch("passwordType") !== "none";
  
  const onSubmit = async (data: DeviceFormValues) => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      // Prepare data for saving
      const deviceData = {
        customer_id: clientId,
        device_type: data.deviceType,
        brand: data.brand,
        model: data.model,
        serial_number: data.serialNumber || null,
        imei: data.imei || null,
        color: data.color || null,
        condition: data.condition,
        password_type: data.passwordType,
        password: data.password || null,
        observations: data.observations || null,
        updated_at: new Date().toISOString()
      };
      
      let newDeviceId: string;
      
      if (isEditing && deviceId) {
        // Update existing device
        const { error } = await supabase
          .from('devices')
          .update(deviceData)
          .eq('id', deviceId);
          
        if (error) throw error;
        
        newDeviceId = deviceId;
        
        toast({
          title: "Dispositivo atualizado com sucesso",
          description: "Os dados do dispositivo foram atualizados.",
        });
      } else {
        // Create new device
        const { data: insertData, error } = await supabase
          .from('devices')
          .insert({ ...deviceData, created_at: new Date().toISOString() })
          .select('id')
          .single();
          
        if (error) throw error;
        
        newDeviceId = insertData.id;
        
        toast({
          title: "Dispositivo registrado com sucesso",
          description: "Você será redirecionado para cadastrar o serviço.",
        });
      }
      
      // Navigate to the next step with client ID and device ID
      navigate(`/service-registration/${clientId}/${newDeviceId}`);
    } catch (error) {
      console.error("Erro ao salvar dispositivo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do dispositivo.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    navigate(`/user-registration?id=${clientId}`);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={isEditing ? "Editar Dispositivo" : "Cadastro de Dispositivo"} 
        description={isEditing ? "Atualize os detalhes do dispositivo." : "Preencha os detalhes do dispositivo."}
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
                          value={field.value}
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
                          value={field.value}
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
                          value={field.value}
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
                          value={field.value}
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
                  {isLoading ? "Carregando..." : isEditing ? "Salvar" : "Próximo"}
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
