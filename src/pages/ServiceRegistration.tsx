
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
  estimatedCompletion: z.date(),
  warranty: z.enum(["1", "3", "6", "12"]),
  status: z.enum(["waiting", "in_progress", "completed", "delivered"]),
  observations: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// Mock technicians for demo purposes
const TECHNICIANS = [
  "Paulo Silva", "Maria Oliveira", "João Santos", "Ana Pereira", "Carlos Ferreira"
];

const ServiceRegistration = () => {
  const navigate = useNavigate();
  const { clientId, deviceId } = useParams<{ clientId: string, deviceId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      clientName: "",
      deviceInfo: "",
      serviceTypes: [],
      otherService: "",
      technician: "",
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      warranty: "3",
      status: "waiting",
      observations: "",
    },
  });
  
  // Fetch client and device data from localStorage (in a real app, this would be from your API)
  useEffect(() => {
    const storedClientData = localStorage.getItem("registrationClient");
    const storedDeviceData = localStorage.getItem("registrationDevice");
    
    if (!storedClientData || !storedDeviceData) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados do cliente ou dispositivo não encontrados. Por favor, reinicie o processo.",
      });
      navigate("/user-registration");
      return;
    }
    
    const client = JSON.parse(storedClientData);
    const device = JSON.parse(storedDeviceData);
    setClientData(client);
    setDeviceData(device);
    
    // Set form values
    form.setValue("clientName", client.name);
    
    // Create a device info summary string
    const deviceInfo = `${device.brand.charAt(0).toUpperCase() + device.brand.slice(1)} ${device.model}`;
    form.setValue("deviceInfo", deviceInfo);
  }, [navigate, form]);
  
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
    setIsLoading(true);
    
    // In a real app, you would save this to your database
    const serviceId = Math.random().toString(36).substring(2, 11);
    
    // For now, we'll use localStorage to simulate saving the data
    localStorage.setItem("registrationService", JSON.stringify({
      id: serviceId,
      clientId,
      deviceId,
      ...data,
      createdAt: new Date().toISOString(),
    }));
    
    // Create a summary of all registration data
    const completeRegistration = {
      client: clientData,
      device: deviceData,
      service: {
        id: serviceId,
        ...data,
        createdAt: new Date().toISOString(),
      }
    };
    
    // Store the complete registration
    localStorage.setItem("completeRegistration", JSON.stringify(completeRegistration));
    
    toast({
      title: "Serviço registrado com sucesso",
      description: "Cadastro completo finalizado com sucesso.",
    });
    
    // Navigate to the services page
    setTimeout(() => {
      navigate("/services");
    }, 1000);
    
    setIsLoading(false);
  };
  
  const goBack = () => {
    navigate(`/device-registration/${clientId}`);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cadastro de Serviço" 
        description="Preencha os detalhes do serviço a ser realizado."
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o técnico" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TECHNICIANS.map((tech) => (
                            <SelectItem key={tech} value={tech.toLowerCase()}>
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="waiting">Em espera</SelectItem>
                          <SelectItem value="in_progress">Em andamento</SelectItem>
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
                  {isLoading ? "Carregando..." : "Cadastrar"}
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
