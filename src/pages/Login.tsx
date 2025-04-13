import { useState, useEffect } from 'react';
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
import { 
  Lock, 
  Mail, 
  Phone, 
  Github, 
  X, 
  Smartphone, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);

  // Efeito para animar o card quando o componente montar
  useEffect(() => {
    setAnimateCard(true);
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center landing-page p-4 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden login-gradient-bg">
      {/* Background elements for visual interest */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-purple-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-cyan-600 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Logo e nome do sistema */}
      <div className={cn(
        "mb-6 flex flex-col items-center transition-all duration-700 transform", 
        animateCard ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
      )}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 icon-container">
          <Smartphone className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Paulo Cell</h1>
        <p className="text-slate-300 mt-1">Sistema de Gerenciamento</p>
      </div>

      <div className={cn(
        "w-full max-w-md transition-all duration-500 transform", 
        animateCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <Card className="shadow-xl border-none rounded-xl overflow-hidden" 
          style={{ 
            background: 'rgba(15, 23, 42, 0.7)', 
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-300">
              Acesse o sistema para gerenciar sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 bg-slate-800/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="login" 
                  className="rounded-md text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  disabled={activeTab !== "signup"} 
                  className="rounded-md text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Mail className="h-4 w-4 mr-2 text-blue-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Lock className="h-4 w-4 mr-2 text-blue-400" />
                            Senha
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="******" 
                                {...field} 
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md pr-10 h-11"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full enter-button h-11 mt-2 font-medium pulse-animation" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
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
                <div className="text-center mt-2">
                  <Button 
                    variant="link" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    onClick={() => setAdminDialogOpen(true)}
                  >
                    Não tem conta? Cadastre-se
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
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <User className="h-4 w-4 mr-2 text-blue-400" />
                            Nome
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Seu nome" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Mail className="h-4 w-4 mr-2 text-blue-400" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu@email.com" 
                              type="email" 
                              {...field} 
                              className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <Lock className="h-4 w-4 mr-2 text-blue-400" />
                            Senha
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="******" 
                                {...field} 
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md pr-10 h-11"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200 flex items-center text-sm font-medium">
                            <ShieldCheck className="h-4 w-4 mr-2 text-blue-400" />
                            Confirmar Senha
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="******" 
                                {...field} 
                                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md pr-10 h-11"
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full enter-button h-11 mt-2 font-medium pulse-animation" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
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
          <CardFooter className="flex justify-center border-t border-slate-700/50 pt-6 pb-4">
            <p className="text-sm text-slate-400">
              Sistema Desenvolvido por{" "}
              <button 
                onClick={() => setDeveloperContactOpen(true)}
                className="text-blue-400 hover:underline focus:outline-none inline-flex items-center"
              >
                Nomade-PJ <Github className="h-3 w-3 ml-1 inline-block" />
              </button>{" "}
              © 2025
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent 
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }} 
          className="border-slate-700/50 rounded-xl shadow-2xl max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Lock className="h-4 w-4 text-yellow-400" />
              </div>
              Área Administrativa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 mt-2">
              Insira a senha administrativa para acessar o cadastro de usuários
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input 
                type="password"
                placeholder="Senha administrativa"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError("");
                }}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-md h-11 pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
            {adminPasswordError && (
              <p className="text-sm text-red-400 mt-2 flex items-center">
                <X className="h-4 w-4 mr-1" />
                {adminPasswordError}
              </p>
            )}
          </div>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setAdminPassword("");
                setAdminPasswordError("");
              }}
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 hover:text-white rounded-md sm:w-auto w-full order-2 sm:order-1"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdminPassword} 
              className="enter-button sm:w-auto w-full order-1 sm:order-2"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Developer Contact Dialog */}
      <Dialog open={developerContactOpen} onOpenChange={setDeveloperContactOpen}>
        <DialogContent 
          className="sm:max-w-md rounded-xl overflow-hidden"
          style={{ 
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <DialogHeader className="border-b border-slate-700/50 pb-4">
            <DialogTitle className="text-xl text-white flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              Contato com o Desenvolvedor
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-2">
              Entre em contato com o desenvolvedor do projeto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <a 
              href="mailto:josecarlosdev24h@gmail.com" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-blue-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-blue-500/30">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-sm text-slate-300">josecarlosdev24h@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/5598992022352" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-green-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-green-500/30">
                <Phone className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">WhatsApp</p>
                <p className="text-sm text-slate-300">(98) 99202-2352</p>
              </div>
            </a>
            
            <a 
              href="https://github.com/Nomade-PJ" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/70 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-purple-500/20 p-2 rounded-full icon-container transition-all group-hover:bg-purple-500/30">
                <Github className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">GitHub</p>
                <p className="text-sm text-slate-300">Nomade-PJ</p>
              </div>
            </a>
          </div>
          
          <div className="pt-2 text-center text-xs text-slate-400">
            ©Todos os direitos reservados - NomadePJ/Jose Carlos
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
