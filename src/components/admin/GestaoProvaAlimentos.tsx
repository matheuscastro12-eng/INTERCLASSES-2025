import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBasket, Award } from "lucide-react";
import { toast } from "sonner";

const pontosAlimentos = [
  { posicao: 1, pontos: 10 },
  { posicao: 2, pontos: 7 },
  { posicao: 3, pontos: 5 },
  { posicao: 4, pontos: 4 },
  { posicao: 5, pontos: 3 },
  { posicao: 6, pontos: 2 },
];

export function GestaoProvaAlimentos() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    const { data } = await supabase
      .from("turmas")
      .select("id, nome_turma, pontuacao:pontuacao_geral(*)")
      .order("graduacao");
    setTurmas(data || []);
  };

  const handleUpdateCestas = async (turmaId: string, cestas: number) => {
    const { error } = await supabase
      .from("pontuacao_geral")
      .update({ cestas_basicas_entregues: cestas })
      .eq("turma_id", turmaId);

    if (error) {
      toast.error("Erro ao atualizar cestas");
    } else {
      toast.success("Cestas atualizadas!");
      fetchTurmas();
    }
  };

  const handleCalcularRanking = async () => {
    // Buscar todas as turmas com seus kg de alimentos
    const { data } = await supabase
      .from("pontuacao_geral")
      .select("turma_id, kg_alimentos, turma:turmas(nome_turma)")
      .order("kg_alimentos", { ascending: false });

    if (!data) return;

    // Aplicar pontuação conforme posição
    const updates = data.slice(0, 6).map((item, index) => ({
      turma_id: item.turma_id,
      pontos_alimentos: pontosAlimentos[index]?.pontos || 0,
    }));

    // Atualizar pontos no banco
    for (const update of updates) {
      await supabase
        .from("pontuacao_geral")
        .update({ pontos_alimentos: update.pontos_alimentos })
        .eq("turma_id", update.turma_id);
    }

    // Zerar pontos das turmas fora do top 6
    const top6Ids = updates.map((u) => u.turma_id);
    await supabase
      .from("pontuacao_geral")
      .update({ pontos_alimentos: 0 })
      .not("turma_id", "in", `(${top6Ids.join(",")})`);

    toast.success("Ranking de alimentos calculado!");
    fetchTurmas();
    
    setRanking(
      data.slice(0, 6).map((item, index) => ({
        turma: item.turma.nome_turma,
        kg: item.kg_alimentos,
        pontos: pontosAlimentos[index]?.pontos || 0,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBasket className="w-5 h-5 text-primary" />
            Gestão Prova do Alimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm">
              <strong>Regras (Art. 85º e 91º):</strong>
              <br />
              1º lugar: 10 pontos | 2º: 7 pontos | 3º: 5 pontos
              <br />
              4º: 4 pontos | 5º: 3 pontos | 6º: 2 pontos
              <br />
              <strong className="text-destructive">Mínimo: 3 cestas básicas por turma (Art. 84º)</strong>
            </p>
          </div>

          <div className="space-y-3">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg"
              >
                <span className="font-bold min-w-[80px]">Turma {turma.nome_turma}</span>
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs">Cestas:</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={turma.pontuacao?.[0]?.cestas_basicas_entregues || 0}
                    className="w-20 h-8"
                    onBlur={(e) =>
                      handleUpdateCestas(turma.id, parseInt(e.target.value) || 0)
                    }
                  />
                  {turma.pontuacao?.[0]?.cestas_basicas_entregues < 3 && (
                    <span className="text-xs text-destructive">
                      Multa: R$
                      {turma.pontuacao?.[0]?.multa_cestas_faltantes?.toFixed(2) || 0}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {turma.pontuacao?.[0]?.kg_alimentos || 0} kg ·{" "}
                  {turma.pontuacao?.[0]?.pontos_alimentos || 0} pts
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleCalcularRanking}
            className="w-full bg-primary hover:bg-primary-glow"
          >
            <Award className="mr-2 h-4 w-4" />
            Calcular Ranking Final
          </Button>

          {ranking.length > 0 && (
            <div className="mt-4 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
              <h4 className="font-bold mb-2">Ranking Prova do Alimento:</h4>
              <div className="space-y-1">
                {ranking.map((r, i) => (
                  <div key={i} className="text-sm">
                    {i + 1}º - Turma {r.turma}: {r.kg} kg ({r.pontos} pontos)
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
