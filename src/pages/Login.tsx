import { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogContent, 
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Lock, Mail, Phone, Github, X, Smartphone } from "lucide-react";

// Schema para validação do formulário de login
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
});

// Schema para validação do formulário de cadastro
const signupSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha deve ter pelo menos 6 caracteres" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const Login = () => {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [developerContactOpen, setDeveloperContactOpen] = useState(false);

  // Se já estiver autenticado, redirecionar para a página inicial
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleLogin = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      // A navegação será feita automaticamente quando isAuthenticated mudar
    } catch (error: any) {
      console.error(error);
      // Toast já é chamado no login() do AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
      setActiveTab("login");
      signupForm.reset();
    } catch (error: any) {
      console.error(error);
      // Toast já é chamado no signup() do AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPassword = () => {
    if (adminPassword === "paulocell@admin1") {
      setActiveTab("signup");
      setAdminDialogOpen(false);
      setAdminPassword("");
      setAdminPasswordError("");
    } else {
      setAdminPasswordError("Senha administrativa incorreta");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center landing-page p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-none" style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(8px)' }}>
          <CardHeader className="space-y-1 text-center border-b border-slate-700 pb-6">
            <div className="mx-auto bg-blue-500/20 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center icon-container">
              <Smartphone className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-100">Paulo Cell Sistema</CardTitle>
            <CardDescription className="text-gray-300">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 bg-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Login</TabsTrigger>
                <TabsTrigger value="signup" disabled={activeTab !== "signup"} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Cadastrar</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="******" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full enter-button" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Entrando...
                        </span>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    onClick={() => setAdminDialogOpen(true)}
                  >
                    Cadastrar
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Nome</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Seu nome" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="******" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="******" 
                              {...field} 
                              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full enter-button" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cadastrando...
                        </span>
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-700 pt-6">
            <p className="text-sm text-gray-400">
              Sistema Desenvolvido por{" "}
              <button 
                onClick={() => setDeveloperContactOpen(true)}
                className="text-blue-400 hover:underline focus:outline-none"
              >
                Nomade-PJ
              </button>{" "}
              © 2025
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent style={{ background: 'hsl(222 47% 11%)' }} className="border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-100">
              <Lock className="h-5 w-5 text-yellow-400" /> Área Administrativa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Insira a senha administrativa para acessar o cadastro de usuários
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              type="password"
              placeholder="Senha administrativa"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setAdminPasswordError("");
              }}
              className="bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500"
            />
            {adminPasswordError && (
              <p className="text-sm text-red-400 mt-2">{adminPasswordError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setAdminPassword("");
                setAdminPasswordError("");
              }}
              className="bg-slate-800 text-gray-200 hover:bg-slate-700 border-slate-700"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminPassword} className="enter-button">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Developer Contact Dialog */}
      <Dialog open={developerContactOpen} onOpenChange={setDeveloperContactOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: 'hsl(222 47% 11%)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-100">Contato com o Desenvolvedor</DialogTitle>
            <DialogDescription className="text-gray-300">
              Entre em contato com o desenvolvedor do projeto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <a 
              href="mailto:josecarlosdev24h@gmail.com" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-blue-500/20 p-2 rounded-full icon-container">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">Email</p>
                <p className="text-sm text-gray-300">josecarlosdev24h@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/5598992022352" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-green-500/20 p-2 rounded-full icon-container">
                <Phone className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">WhatsApp</p>
                <p className="text-sm text-gray-300">(98) 99202-2352</p>
              </div>
            </a>
            
            <a 
              href="https://github.com/Nomade-PJ" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-purple-500/20 p-2 rounded-full icon-container">
                <Github className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">GitHub</p>
                <p className="text-sm text-gray-300">Nomade-PJ</p>
              </div>
            </a>
          </div>
          
          <div className="pt-4 text-center text-xs text-gray-400">
            ©Todos os direitos reserved - NomadePJ/Jose Carlos
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              className="enter-button px-8 py-2"
              onClick={() => setDeveloperContactOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
