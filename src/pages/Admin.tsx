import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, Users, Trophy, FileText, Heart, ShoppingBasket, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GestaoAtletas } from "@/components/admin/GestaoAtletas";
import { RegistroSumula } from "@/components/admin/RegistroSumula";
import { ProvaSolidaria } from "@/components/admin/ProvaSolidaria";
import { GestaoProvaAlimentos } from "@/components/admin/GestaoProvaAlimentos";
import { GestaoPenalidades } from "@/components/admin/GestaoPenalidades";
import { ResetarTudo } from "@/components/admin/ResetarTudo";

const Admin = () => {
  const navigate = useNavigate();
  const { profile, loading, signOut, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
    }
    if (!loading && profile && !isAdmin) {
      toast.error("Acesso negado: Apenas administradores podem acessar esta área");
      navigate("/");
    }
  }, [profile, loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  if (loading || !profile || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tactical">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tactical">
      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-tactical">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg shadow-glow">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  INTERCLASSES 2025 · Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestão AAAEC · @{profile.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-primary/30"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Ver Placar
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="atletas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card border border-primary/30">
            <TabsTrigger value="atletas" className="data-[state=active]:bg-primary">
              <Users className="mr-2 h-4 w-4" />
              Atletas
            </TabsTrigger>
            <TabsTrigger value="sumula" className="data-[state=active]:bg-primary">
              <FileText className="mr-2 h-4 w-4" />
              Súmulas
            </TabsTrigger>
            <TabsTrigger value="solidaria" className="data-[state=active]:bg-primary">
              <Heart className="mr-2 h-4 w-4" />
              Solidária
            </TabsTrigger>
            <TabsTrigger value="alimentos" className="data-[state=active]:bg-primary">
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Alimentos
            </TabsTrigger>
            <TabsTrigger value="penalidades" className="data-[state=active]:bg-primary">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Penalidades
            </TabsTrigger>
            <TabsTrigger value="resetar" className="data-[state=active]:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Resetar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="atletas" className="space-y-4">
            <GestaoAtletas />
          </TabsContent>

          <TabsContent value="sumula" className="space-y-4">
            <RegistroSumula />
          </TabsContent>

          <TabsContent value="solidaria" className="space-y-4">
            <ProvaSolidaria />
          </TabsContent>

          <TabsContent value="alimentos" className="space-y-4">
            <GestaoProvaAlimentos />
          </TabsContent>

          <TabsContent value="penalidades" className="space-y-4">
            <GestaoPenalidades />
          </TabsContent>

          <TabsContent value="resetar" className="space-y-4">
            <ResetarTudo />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
