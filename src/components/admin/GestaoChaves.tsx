import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Eye, Trash2, Trophy } from "lucide-react";
import { CriadorChave } from "./chaves/CriadorChave";
import { VisualizadorChave } from "./chaves/VisualizadorChave";

type ChaveTorneio = {
  id: string;
  modalidade: string;
  genero_modalidade: string;
  formato: string;
  numero_times: number;
  estrutura_chave: any;
  status: string;
  created_at: string;
};

const modalidades = [
  "Futsal Masculino",
  "Futsal Feminino",
  "Vôlei Masculino",
  "Vôlei Feminino",
  "Basquete Masculino",
  "Basquete Feminino",
  "Futebol de Campo Masculino",
  "Pebolim",
  "Sinuca",
  "Xadrez",
];

export function GestaoChaves() {
  const [chaves, setChaves] = useState<ChaveTorneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visualizarChave, setVisualizarChave] = useState<ChaveTorneio | null>(null);
  
  // Form state
  const [modalidade, setModalidade] = useState("");
  const [formato, setFormato] = useState("eliminatoria_simples");
  const [numeroTimes, setNumeroTimes] = useState(8);

  useEffect(() => {
    fetchChaves();
  }, []);

  const fetchChaves = async () => {
    try {
      const { data, error } = await supabase
        .from("chaves_torneio")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChaves(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar chaves: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarChave = async () => {
    if (!modalidade) {
      toast.error("Selecione uma modalidade");
      return;
    }

    try {
      // Determinar gênero baseado na modalidade
      let genero: "Masculino" | "Feminino" | "Outro" = "Outro";
      if (modalidade.includes("Masculino")) genero = "Masculino";
      else if (modalidade.includes("Feminino")) genero = "Feminino";

      const { data, error } = await supabase
        .from("chaves_torneio")
        .insert({
          modalidade,
          genero_modalidade: genero,
          formato,
          numero_times: numeroTimes,
          estrutura_chave: { fases: [], turmas: [] },
          status: "rascunho",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Chave criada com sucesso!");
      setDialogOpen(false);
      setVisualizarChave(data);
      fetchChaves();
    } catch (error: any) {
      toast.error("Erro ao criar chave: " + error.message);
    }
  };

  const handleDeletarChave = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta chave?")) return;

    try {
      const { error } = await supabase
        .from("chaves_torneio")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Chave deletada com sucesso!");
      fetchChaves();
    } catch (error: any) {
      toast.error("Erro ao deletar chave: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      rascunho: "secondary",
      ativo: "default",
      finalizado: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (visualizarChave) {
    return (
      <VisualizadorChave
        chave={visualizarChave}
        onVoltar={() => {
          setVisualizarChave(null);
          fetchChaves();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Chaves</h2>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie os brackets dos torneios
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Chave</DialogTitle>
              <DialogDescription>
                Configure os parâmetros iniciais do torneio
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Modalidade *</Label>
                <Select value={modalidade} onValueChange={setModalidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalidades.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Formato *</Label>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eliminatoria_simples">
                      Eliminatória Simples
                    </SelectItem>
                    <SelectItem value="grupos_eliminatoria">
                      Fase de Grupos + Eliminatória
                    </SelectItem>
                    <SelectItem value="todos_contra_todos">
                      Todos Contra Todos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Número de Times *</Label>
                <Select
                  value={numeroTimes.toString()}
                  onValueChange={(v) => setNumeroTimes(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 times</SelectItem>
                    <SelectItem value="8">8 times</SelectItem>
                    <SelectItem value="16">16 times</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarChave}>Criar Chave</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma chave criada ainda.
              <br />
              Clique em "Nova Chave" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chaves.map((chave) => (
            <Card key={chave.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{chave.modalidade}</CardTitle>
                    <CardDescription>
                      {chave.formato.replace(/_/g, " ").toUpperCase()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(chave.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Times:</span>
                    <span className="font-medium">{chave.numero_times}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {new Date(chave.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setVisualizarChave(chave)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletarChave(chave.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
