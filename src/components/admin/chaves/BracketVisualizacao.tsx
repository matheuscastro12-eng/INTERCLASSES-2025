import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trophy, Edit2 } from "lucide-react";

type Confronto = {
  id: string;
  turma_a: { id: string; nome_turma: string };
  turma_b: { id: string; nome_turma: string };
  placar_a: number | null;
  placar_b: number | null;
  vencedor: string | null;
  fase: string;
};

type BracketVisualizacaoProps = {
  chave: any;
  onAtualizar: () => void;
};

export function BracketVisualizacao({ chave, onAtualizar }: BracketVisualizacaoProps) {
  const [confrontoSelecionado, setConfrontoSelecionado] = useState<Confronto | null>(null);
  const [placarA, setPlacarA] = useState("");
  const [placarB, setPlacarB] = useState("");

  const confrontos: Confronto[] = chave.estrutura_chave?.confrontos || [];
  const fases: string[] = chave.estrutura_chave?.fases || [];

  const handleRegistrarResultado = async () => {
    if (!confrontoSelecionado) return;

    const pA = parseInt(placarA);
    const pB = parseInt(placarB);

    if (isNaN(pA) || isNaN(pB)) {
      toast.error("Insira placares válidos");
      return;
    }

    try {
      const vencedorId = pA > pB ? confrontoSelecionado.turma_a.id : confrontoSelecionado.turma_b.id;
      
      // Atualizar confronto na estrutura
      const novosConfrontos = confrontos.map((c) => {
        if (c.id === confrontoSelecionado.id) {
          return {
            ...c,
            placar_a: pA,
            placar_b: pB,
            vencedor: vencedorId,
          };
        }
        return c;
      });

      // Atualizar próxima fase se necessário
      const proximaFase = avancaVencedor(confrontoSelecionado, vencedorId, novosConfrontos);

      const { error } = await supabase
        .from("chaves_torneio")
        .update({
          estrutura_chave: {
            ...chave.estrutura_chave,
            confrontos: proximaFase,
          },
        })
        .eq("id", chave.id);

      if (error) throw error;

      // Registrar partida na tabela de partidas
      await registrarPartida(confrontoSelecionado, pA, pB, vencedorId);

      toast.success("Resultado registrado!");
      setConfrontoSelecionado(null);
      setPlacarA("");
      setPlacarB("");
      onAtualizar();
    } catch (error: any) {
      toast.error("Erro ao registrar resultado: " + error.message);
    }
  };

  const registrarPartida = async (
    confronto: Confronto,
    pA: number,
    pB: number,
    vencedorId: string
  ) => {
    try {
      await supabase.from("partidas").insert({
        modalidade: chave.modalidade,
        genero_modalidade: chave.genero_modalidade,
        fase: confronto.fase,
        turma_a_id: confronto.turma_a.id,
        turma_b_id: confronto.turma_b.id,
        placar_a: pA,
        placar_b: pB,
        vencedor_id: vencedorId,
        status: "finalizada",
        data_hora: null,
      });
    } catch (error) {
      console.error("Erro ao registrar partida:", error);
    }
  };

  const avancaVencedor = (
    confronto: Confronto,
    vencedorId: string,
    confrontos: Confronto[]
  ) => {
    const faseAtual = confronto.fase;
    const indexFaseAtual = fases.indexOf(faseAtual);
    
    if (indexFaseAtual === fases.length - 1) {
      // É a final, não há próxima fase
      return confrontos;
    }

    const proximaFase = fases[indexFaseAtual + 1];
    const vencedor = vencedorId === confronto.turma_a.id ? confronto.turma_a : confronto.turma_b;

    // Encontrar confronto da próxima fase
    const confrontosProximaFase = confrontos.filter((c) => c.fase === proximaFase);
    
    // Lógica simplificada: adiciona vencedor ao próximo confronto vazio
    const confrontoAtualizado = confrontosProximaFase.find(
      (c) => !c.turma_a || !c.turma_b
    );

    if (confrontoAtualizado) {
      const novosConfrontos = confrontos.map((c) => {
        if (c.id === confrontoAtualizado.id) {
          if (!c.turma_a) {
            return { ...c, turma_a: vencedor };
          } else if (!c.turma_b) {
            return { ...c, turma_b: vencedor };
          }
        }
        return c;
      });
      return novosConfrontos;
    }

    return confrontos;
  };

  const getStatusConfronto = (confronto: Confronto) => {
    if (confronto.vencedor) return "finalizado";
    if (confronto.turma_a && confronto.turma_b) return "pronto";
    return "aguardando";
  };

  const agruparPorFase = () => {
    const agrupado: Record<string, Confronto[]> = {};
    fases.forEach((fase) => {
      agrupado[fase] = confrontos.filter((c) => c.fase === fase);
    });
    return agrupado;
  };

  const confrontosPorFase = agruparPorFase();

  if (confrontos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum confronto definido ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {fases.map((fase) => (
        <div key={fase} className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">{fase}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {confrontosPorFase[fase]?.map((confronto) => {
              const status = getStatusConfronto(confronto);
              return (
                <Card
                  key={confronto.id}
                  className={`
                    transition-all
                    ${status === "finalizado" ? "border-green-500/50 bg-green-500/5" : ""}
                    ${status === "pronto" ? "border-yellow-500/50 bg-yellow-500/5" : ""}
                    ${status === "aguardando" ? "border-muted bg-muted/20" : ""}
                  `}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {confronto.turma_a?.nome_turma || "A definir"}
                      </span>
                      {confronto.placar_a !== null && (
                        <span className="text-lg font-bold">{confronto.placar_a}</span>
                      )}
                    </div>
                    
                    <div className="border-t border-muted" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {confronto.turma_b?.nome_turma || "A definir"}
                      </span>
                      {confronto.placar_b !== null && (
                        <span className="text-lg font-bold">{confronto.placar_b}</span>
                      )}
                    </div>

                    {status === "pronto" && !confronto.vencedor && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          setConfrontoSelecionado(confronto);
                          setPlacarA(confronto.placar_a?.toString() || "");
                          setPlacarB(confronto.placar_b?.toString() || "");
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Registrar Resultado
                      </Button>
                    )}

                    {confronto.vencedor && (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                        <Trophy className="h-4 w-4" />
                        Vencedor: {
                          confronto.vencedor === confronto.turma_a.id
                            ? confronto.turma_a.nome_turma
                            : confronto.turma_b.nome_turma
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Dialog
        open={confrontoSelecionado !== null}
        onOpenChange={(open) => !open && setConfrontoSelecionado(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
          </DialogHeader>

          {confrontoSelecionado && (
            <div className="space-y-4 py-4">
              <div>
                <Label>{confrontoSelecionado.turma_a.nome_turma}</Label>
                <Input
                  type="number"
                  min="0"
                  value={placarA}
                  onChange={(e) => setPlacarA(e.target.value)}
                  placeholder="Placar"
                />
              </div>

              <div>
                <Label>{confrontoSelecionado.turma_b.nome_turma}</Label>
                <Input
                  type="number"
                  min="0"
                  value={placarB}
                  onChange={(e) => setPlacarB(e.target.value)}
                  placeholder="Placar"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfrontoSelecionado(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleRegistrarResultado}>Confirmar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
