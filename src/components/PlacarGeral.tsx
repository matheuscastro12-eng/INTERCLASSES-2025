import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PontuacaoTurma {
  turma_id: string;
  turma: {
    nome_turma: string;
    internato: boolean;
    calouro: boolean;
    sexto_ano: boolean;
  };
  total_pontos: number;
  pontos_esportivos: number;
  pontos_alimentos: number;
  pontos_sangue: number;
  kg_alimentos: number;
  pen_wo_esportivo: number;
  pen_disciplinar: number;
  pen_nao_plantao: number;
}

export function PlacarGeral() {
  const [ranking, setRanking] = useState<PontuacaoTurma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();

    // Realtime updates
    const channel = supabase
      .channel('pontuacao-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pontuacao_geral'
        },
        () => {
          fetchRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase
        .from("pontuacao_geral")
        .select(`
          *,
          turma:turmas(nome_turma, internato, calouro, sexto_ano)
        `)
        .order("total_pontos", { ascending: false })
        .order("kg_alimentos", { ascending: false });

      if (error) throw error;
      setRanking(data as any);
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/30 shadow-tactical">
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 shadow-tactical">
      <CardHeader className="border-b border-primary/20 bg-gradient-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Trophy className="w-6 h-6 text-secondary" />
          </div>
          <CardTitle className="text-2xl">Classificação Geral</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {ranking.map((item, index) => (
            <div
              key={item.turma_id}
              className={`p-4 hover:bg-muted/30 transition-colors ${
                index < 3 ? "bg-muted/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Posição */}
                <div className="flex-shrink-0 w-12">
                  {index === 0 ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-victory flex items-center justify-center shadow-victory">
                      <span className="text-xl font-bold text-secondary-foreground">
                        1º
                      </span>
                    </div>
                  ) : index === 1 ? (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold">2º</span>
                    </div>
                  ) : index === 2 ? (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold">3º</span>
                    </div>
                  ) : (
                    <span className="text-lg text-muted-foreground ml-3">
                      {index + 1}º
                    </span>
                  )}
                </div>

                {/* Turma */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">Turma {item.turma.nome_turma}</h3>
                    {item.turma.internato && (
                      <Badge variant="outline" className="text-xs border-primary/40">
                        Internato
                      </Badge>
                    )}
                    {item.turma.calouro && (
                      <Badge variant="outline" className="text-xs border-secondary/40">
                        Calouro
                      </Badge>
                    )}
                    {item.turma.sexto_ano && (
                      <Badge variant="outline" className="text-xs border-accent/40">
                        6º Ano
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex gap-4">
                      <span>Esportivos: <strong className="text-foreground">{item.pontos_esportivos}</strong></span>
                      <span>Alimentos: <strong className="text-foreground">{item.pontos_alimentos}</strong></span>
                      <span>Sangue: <strong className="text-foreground">{item.pontos_sangue}</strong></span>
                    </div>
                    {(item.pen_wo_esportivo > 0 || item.pen_disciplinar > 0 || item.pen_nao_plantao > 0) && (
                      <div className="flex gap-4 text-destructive">
                        {item.pen_wo_esportivo > 0 && <span>WO: -{item.pen_wo_esportivo}</span>}
                        {item.pen_disciplinar > 0 && <span>Disciplinar: -{item.pen_disciplinar}</span>}
                        {item.pen_nao_plantao > 0 && <span>Plantão: -{item.pen_nao_plantao}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pontos Totais */}
                <div className="flex-shrink-0">
                  <div className={`text-right ${index === 0 ? "animate-pulse" : ""}`}>
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {index === 0 && <TrendingUp className="w-5 h-5 text-secondary" />}
                      <span className={`text-3xl font-bold ${
                        index === 0 ? "text-secondary" : ""
                      }`}>
                        {item.total_pontos}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">pontos</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
