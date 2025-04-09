
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
import { Lock } from "lucide-react";

// Schema para validação do formulário de login
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
});

// Schema para validação do formulário de cadastro
const signupSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha deve ter pelo menos 6 caracteres" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
});

// Schema para validação da senha de admin
const adminPasswordSchema = z.object({
  adminPassword: z.string()
    .refine((val) => val === "paulocell@admin1", {
      message: "Senha administrativa incorreta"
    })
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type AdminPasswordForm = z.infer<typeof adminPasswordSchema>;

const Login = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");

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
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleLogin = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (values: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(values.email, values.password);
      toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
      setActiveTab("login");
      signupForm.reset();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer cadastro. " + (error.message || "Tente novamente mais tarde."));
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Paulo Cell Manager</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup" disabled>Cadastrar</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
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
                    className="mt-2 text-sm text-blue-600 hover:underline"
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
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
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Paulo Cell Manager © {new Date().getFullYear()}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Admin Password Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Área Administrativa
            </AlertDialogTitle>
            <AlertDialogDescription>
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
            />
            {adminPasswordError && (
              <p className="text-sm text-red-500 mt-2">{adminPasswordError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setAdminPassword("");
              setAdminPasswordError("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminPassword}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
