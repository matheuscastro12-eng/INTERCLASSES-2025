import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, Settings } from "lucide-react";
import { PlacarGeral } from "@/components/PlacarGeral";
import { UltimosJogos } from "@/components/UltimosJogos";

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-tactical">
      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-tactical">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg shadow-glow">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  INTERCLASSES 2025
                </h1>
                <p className="text-xs text-muted-foreground">
                  AAAEC - Associação Atlética Acadêmica Ênio Capucho
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!loading && !profile && (
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-primary hover:bg-primary-glow shadow-glow"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
              {!loading && profile && isAdmin && (
                <Button
                  onClick={() => navigate("/admin")}
                  variant="outline"
                  className="border-primary/30"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Painel Admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Acompanhe o <span className="text-primary">Interclasses 2025</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Resultados em tempo real · Turmas 54 a 65
          </p>
        </div>

        {/* Placar Geral */}
        <PlacarGeral />

        {/* Últimos Jogos */}
        <UltimosJogos />
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/30 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 AAAEC - Associação Atlética Acadêmica Ênio Capucho · Interclasses 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
