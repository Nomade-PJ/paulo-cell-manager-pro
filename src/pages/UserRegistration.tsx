
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
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
import { cpfRegex, cnpjRegex } from "@/lib/utils";

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve conter pelo menos 3 caracteres" }),
  documentType: z.enum(["cpf", "cnpj"]),
  document: z.string().refine(
    (doc) => {
      if (doc.length === 0) return true; // Allow empty for now, we'll validate later
      const cleaned = doc.replace(/\D/g, "");
      return cleaned.length === 11 || cleaned.length === 14;
    },
    { message: "CPF ou CNPJ inválido" }
  ),
  phone: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, { message: "CEP inválido" }).optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal(""))
});

type UserFormValues = z.infer<typeof userFormSchema>;

const UserRegistration = () => {
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf");
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      documentType: "cpf",
      document: "",
      phone: "",
      email: "",
      cep: "",
      state: "",
      city: "",
      neighborhood: "",
      street: "",
      number: "",
      complement: ""
    },
  });
  
  // Handle CEP lookup
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.length < 8) return;
    
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue("state", data.uf);
        form.setValue("city", data.localidade);
        form.setValue("neighborhood", data.bairro);
        form.setValue("street", data.logradouro);
        toast({
          title: "CEP encontrado",
          description: "Endereço preenchido automaticamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "CEP inválido",
          description: "Não foi possível encontrar o endereço para este CEP.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar CEP",
        description: "Ocorreu um erro ao buscar o endereço. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDocumentValidation = async (document: string, type: "cpf" | "cnpj") => {
    // In a real application, you would validate with an API
    // Here we're just checking the format
    const cleaned = document.replace(/\D/g, "");
    
    if (type === "cpf" && cleaned.length === 11) {
      if (!cpfRegex.test(document)) {
        toast({
          variant: "destructive",
          title: "CPF inválido",
          description: "O CPF informado não é válido.",
        });
        return false;
      }
      return true;
    }
    
    if (type === "cnpj" && cleaned.length === 14) {
      if (!cnpjRegex.test(document)) {
        toast({
          variant: "destructive",
          title: "CNPJ inválido",
          description: "O CNPJ informado não é válido.",
        });
        return false;
      }
      return true;
    }
    
    return false;
  };
  
  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    
    // Validate document
    if (data.document && !await handleDocumentValidation(data.document, data.documentType)) {
      setIsLoading(false);
      return;
    }
    
    // In a real app, you would save this to your database
    const clientId = Math.random().toString(36).substring(2, 11);
    
    // For now, we'll use localStorage to simulate persistence between steps
    localStorage.setItem("registrationClient", JSON.stringify({
      id: clientId,
      ...data
    }));
    
    toast({
      title: "Cliente registrado com sucesso",
      description: "Você será redirecionado para cadastrar o dispositivo.",
    });
    
    // Navigate to the next step with client ID
    navigate(`/device-registration/${clientId}`);
    setIsLoading(false);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cadastro Completo do Usuário" 
        description="Preencha os dados do cliente para continuar com o cadastro."
      >
        <UserPlus className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Dados Pessoais</h2>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento*</FormLabel>
                      <FormControl>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="cpf"
                              checked={field.value === "cpf"}
                              onChange={() => {
                                field.onChange("cpf");
                                setDocumentType("cpf");
                                form.setValue("document", "");
                              }}
                              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span>CPF</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              value="cnpj"
                              checked={field.value === "cnpj"}
                              onChange={() => {
                                field.onChange("cnpj");
                                setDocumentType("cnpj");
                                form.setValue("document", "");
                              }}
                              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span>CNPJ</span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{documentType === "cpf" ? "CPF*" : "CNPJ*"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-xl font-semibold">Endereço</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input 
                            placeholder="00000-000" 
                            {...field}
                            onBlur={() => handleCepLookup(field.value)} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Rua/Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartamento, bloco, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? "Carregando..." : "Próximo"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default UserRegistration;
