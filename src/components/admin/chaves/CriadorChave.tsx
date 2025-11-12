import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TurmaItem } from "./TurmaItem";
import { Shuffle, Save } from "lucide-react";

type Turma = {
  id: string;
  nome_turma: string;
};

type CriadorChaveProps = {
  chaveId: string;
  numeroTimes: number;
  onSalvar: () => void;
};

export function CriadorChave({ chaveId, numeroTimes, onSalvar }: CriadorChaveProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<(Turma | null)[]>(
    Array(numeroTimes).fill(null)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome_turma")
        .order("graduacao", { ascending: true });

      if (error) throw error;
      setTurmas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar turmas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarTurma = (posicao: number, turmaId: string) => {
    const turma = turmas.find((t) => t.id === turmaId);
    if (!turma) return;

    const novasSelecionadas = [...turmasSelecionadas];
    novasSelecionadas[posicao] = turma;
    setTurmasSelecionadas(novasSelecionadas);
  };

  const handleRemoverTurma = (posicao: number) => {
    const novasSelecionadas = [...turmasSelecionadas];
    novasSelecionadas[posicao] = null;
    setTurmasSelecionadas(novasSelecionadas);
  };

  const handleSortear = () => {
    const turmasDisponiveis = [...turmas];
    const turmasSorteadas = Array(numeroTimes)
      .fill(null)
      .map(() => {
        if (turmasDisponiveis.length === 0) return null;
        const index = Math.floor(Math.random() * turmasDisponiveis.length);
        return turmasDisponiveis.splice(index, 1)[0];
      });

    setTurmasSelecionadas(turmasSorteadas);
    toast.success("Turmas sorteadas!");
  };

  const handleSalvar = async () => {
    const turmasValidas = turmasSelecionadas.filter((t) => t !== null);
    
    if (turmasValidas.length < 2) {
      toast.error("Selecione pelo menos 2 turmas");
      return;
    }

    try {
      // Criar estrutura inicial da chave
      const estrutura = gerarEstruturaInicial(turmasSelecionadas as Turma[]);

      const { error } = await supabase
        .from("chaves_torneio")
        .update({
          estrutura_chave: estrutura,
          status: "ativo",
        })
        .eq("id", chaveId);

      if (error) throw error;

      toast.success("Chave salva com sucesso!");
      onSalvar();
    } catch (error: any) {
      toast.error("Erro ao salvar chave: " + error.message);
    }
  };

  const gerarEstruturaInicial = (turmas: Turma[]) => {
    const turmasValidas = turmas.filter((t) => t !== null);
    const confrontos = [];

    // Gerar confrontos da primeira fase
    for (let i = 0; i < turmasValidas.length; i += 2) {
      if (turmasValidas[i + 1]) {
        confrontos.push({
          id: `confronto_${i / 2 + 1}`,
          turma_a: turmasValidas[i],
          turma_b: turmasValidas[i + 1],
          placar_a: null,
          placar_b: null,
          vencedor: null,
          fase: determinarFase(turmasValidas.length, 0),
        });
      }
    }

    return {
      turmas: turmasValidas,
      confrontos,
      fases: gerarFases(turmasValidas.length),
    };
  };

  const determinarFase = (totalTimes: number, indice: number) => {
    if (totalTimes === 16) return "Oitavas";
    if (totalTimes === 8) return "Quartas";
    if (totalTimes === 4) return "Semifinal";
    return "Final";
  };

  const gerarFases = (totalTimes: number) => {
    const fases = ["Final"];
    if (totalTimes >= 4) fases.unshift("Semifinal");
    if (totalTimes >= 8) fases.unshift("Quartas");
    if (totalTimes >= 16) fases.unshift("Oitavas");
    return fases;
  };

  const turmasDisponiveis = turmas.filter(
    (t) => !turmasSelecionadas.some((ts) => ts?.id === t.id)
  );

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
        <h3 className="text-lg font-semibold">Organizar Times na Chave</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSortear}>
            <Shuffle className="mr-2 h-4 w-4" />
            Sortear
          </Button>
          <Button onClick={handleSalvar}>
            <Save className="mr-2 h-4 w-4" />
            Salvar e Ativar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posições na Chave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {turmasSelecionadas.map((turma, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium w-12">#{index + 1}</span>
                {turma ? (
                  <div className="flex-1 flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm">{turma.nome_turma}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverTurma(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => handleSelecionarTurma(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecionar turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {turmasDisponiveis.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome_turma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turmas Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {turmasDisponiveis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todas as turmas foram selecionadas
                </p>
              ) : (
                turmasDisponiveis.map((turma) => (
                  <div
                    key={turma.id}
                    className="p-2 bg-muted rounded text-sm hover:bg-muted/80 transition-colors"
                  >
                    {turma.nome_turma}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
