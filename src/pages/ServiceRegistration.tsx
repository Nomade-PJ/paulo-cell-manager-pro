
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, ArrowLeft } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const serviceTypes = [
  { id: "battery", label: "Substituição de Bateria" },
  { id: "board", label: "Reparo de Placa" },
  { id: "connector", label: "Troca de Conector de Carga" },
  { id: "software", label: "Atualização do Software" },
  { id: "cleaning", label: "Limpeza Interna" },
  { id: "other", label: "Outros Serviços" },
] as const;

const serviceFormSchema = z.object({
  clientName: z.string(),
  deviceInfo: z.string(),
  serviceTypes: z.array(z.string()).min(1, { message: "Selecione pelo menos um serviço" }),
  otherService: z.string().optional(),
  technician: z.string().min(1, { message: "Selecione o técnico responsável" }),
  price: z.string().min(1, { message: "Informe o preço" }),
  estimatedCompletion: z.date(),
  warranty: z.enum(["1", "3", "6", "12"]),
  status: z.enum(["pending", "in_progress", "waiting_parts", "completed", "delivered"]),
  observations: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// Mock technicians for demo purposes
const TECHNICIANS = [
  "Paulo Silva", "Maria Oliveira", "João Santos", "Ana Pereira", "Carlos Ferreira"
];

const ServiceRegistration = () => {
  const navigate = useNavigate();
  const { clientId, deviceId, serviceId } = useParams<{ clientId: string, deviceId: string, serviceId?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      clientName: "",
      deviceInfo: "",
      serviceTypes: [],
      otherService: "",
      technician: "",
      price: "",
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      warranty: "3",
      status: "pending",
      observations: "",
    },
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (serviceId) {
          // We're editing an existing service
          setIsEditing(true);
          
          // Fetch service data
          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', serviceId)
            .single();
            
          if (serviceError) throw serviceError;
          
          // Fetch related customer
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', serviceData.customer_id)
            .single();
            
          if (customerError) throw customerError;
          
          // Fetch related device
          const { data: deviceData, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', serviceData.device_id)
            .single();
            
          if (deviceError) throw deviceError;
          
          // Set client and device data
          setClientData(customerData);
          setDeviceData(deviceData);
          
          // Parse the service types (stored as comma-separated string)
          const serviceTypesList = serviceData.service_type.split(',').map((t: string) => t.trim());
          setSelectedServices(serviceTypesList);
          
          // Fill form with service data
          form.setValue("clientName", customerData.name);
          form.setValue("deviceInfo", `${deviceData.brand} ${deviceData.model}`);
          form.setValue("serviceTypes", serviceTypesList);
          form.setValue("otherService", serviceData.other_service_description || "");
          form.setValue("technician", serviceData.technician_id || "");
          form.setValue("price", serviceData.price.toString());
          form.setValue("estimatedCompletion", new Date(serviceData.estimated_completion_date));
          form.setValue("warranty", serviceData.warranty_period || "3");
          form.setValue("status", serviceData.status);
          form.setValue("observations", serviceData.observations || "");
        } else if (clientId && deviceId) {
          // New service, fetch client and device data
          const { data: clientData, error: clientError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', clientId)
            .single();
            
          if (clientError) throw clientError;
          
          const { data: deviceData, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .single();
            
          if (deviceError) throw deviceError;
          
          setClientData(clientData);
          setDeviceData(deviceData);
          
          // Set form values
          form.setValue("clientName", clientData.name);
          form.setValue("deviceInfo", `${deviceData.brand.charAt(0).toUpperCase() + deviceData.brand.slice(1)} ${deviceData.model}`);
        } else {
          throw new Error("Dados incompletos");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários.",
        });
        navigate("/services");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, deviceId, serviceId, form, navigate]);
  
  // Handle service type selection
  const handleServiceTypeChange = (checked: boolean, serviceType: string) => {
    setSelectedServices(prevSelectedServices => {
      if (checked) {
        return [...prevSelectedServices, serviceType];
      } else {
        return prevSelectedServices.filter(type => type !== serviceType);
      }
    });
    
    const selectedServiceTypes = checked 
      ? [...form.getValues("serviceTypes"), serviceType]
      : form.getValues("serviceTypes").filter(type => type !== serviceType);
    
    form.setValue("serviceTypes", selectedServiceTypes, { shouldValidate: true });
  };
  
  const showOtherServiceField = selectedServices.includes("other");
  
  const onSubmit = async (data: ServiceFormValues) => {
    if (!clientId || !deviceId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados de cliente ou dispositivo não encontrados.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calculate warranty date 
      const estimatedCompletion = data.estimatedCompletion;
      const warrantyMonths = parseInt(data.warranty);
      const warrantyDate = new Date(estimatedCompletion);
      warrantyDate.setMonth(estimatedCompletion.getMonth() + warrantyMonths);
      
      // Format price as a number
      const price = parseFloat(data.price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      
      if (isNaN(price)) {
        throw new Error("Preço inválido");
      }
      
      // Prepare service data for saving
      const serviceData = {
        customer_id: clientId,
        device_id: deviceId,
        service_type: data.serviceTypes.join(','),
        other_service_description: data.otherService || null,
        technician_id: data.technician,
        price: price,
        estimated_completion_date: data.estimatedCompletion.toISOString(),
        warranty_period: data.warranty,
        warranty_until: warrantyDate.toISOString(),
        status: data.status,
        observations: data.observations || null,
        priority: data.serviceTypes.includes('board') ? 'high' : 
                 data.serviceTypes.includes('battery') || data.serviceTypes.includes('connector') ? 'normal' : 'low',
        updated_at: new Date().toISOString()
      };
      
      if (isEditing && serviceId) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', serviceId);
          
        if (error) throw error;
        
        toast({
          title: "Serviço atualizado com sucesso",
          description: "Os dados do serviço foram atualizados.",
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({ ...serviceData, created_at: new Date().toISOString() });
          
        if (error) throw error;
        
        toast({
          title: "Serviço registrado com sucesso",
          description: "O serviço foi cadastrado com sucesso.",
        });
      }
      
      // Navigate back to services page
      navigate("/services");
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do serviço.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    navigate(`/device-registration/${clientId}${deviceId ? `/${deviceId}` : ''}`);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={isEditing ? "Editar Serviço" : "Cadastro de Serviço"} 
        description={isEditing ? "Atualize os detalhes do serviço." : "Preencha os detalhes do serviço a ser realizado."}
      >
        <Wrench className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={goBack} size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar para dados do dispositivo
          </Button>
        </div>
        
        {clientData && deviceData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Informações Básicas</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do cliente" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deviceInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispositivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Informações do dispositivo" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-xl font-semibold">Detalhes do Serviço</h2>
                
                <FormField
                  control={form.control}
                  name="serviceTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço*</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {serviceTypes.map((serviceType) => (
                          <div key={serviceType.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`service-${serviceType.id}`}
                              checked={selectedServices.includes(serviceType.id)}
                              onCheckedChange={(checked) => {
                                handleServiceTypeChange(!!checked, serviceType.id);
                              }}
                            />
                            <label
                              htmlFor={`service-${serviceType.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {serviceType.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {showOtherServiceField && (
                  <FormField
                    control={form.control}
                    name="otherService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique o serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva o serviço..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="technician"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Técnico Responsável*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o técnico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TECHNICIANS.map((tech) => (
                            <SelectItem key={tech} value={tech}>
                              {tech}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço do Serviço*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="R$ 0,00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estimatedCompletion"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Previsão de Conclusão*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal flex justify-between"
                              }
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warranty"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Garantia do Serviço*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex space-x-4 flex-wrap"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="warranty-1" />
                            <label htmlFor="warranty-1">1 mês</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id="warranty-3" />
                            <label htmlFor="warranty-3">3 meses</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6" id="warranty-6" />
                            <label htmlFor="warranty-6">6 meses</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="12" id="warranty-12" />
                            <label htmlFor="warranty-12">12 meses</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Serviço*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Em espera</SelectItem>
                          <SelectItem value="in_progress">Em andamento</SelectItem>
                          <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre o serviço..." 
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
                  {isLoading ? "Carregando..." : isEditing ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ServiceRegistration;
