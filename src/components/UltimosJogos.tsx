import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Partida {
  id: string;
  modalidade: string;
  genero_modalidade: string;
  fase: string;
  data_hora: string;
  placar_a: number | null;
  placar_b: number | null;
  wo_aplicado: boolean;
  status: string;
  turma_a: { nome_turma: string };
  turma_b: { nome_turma: string };
  vencedor: { nome_turma: string } | null;
}

export function UltimosJogos() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalidadeFiltro, setModalidadeFiltro] = useState<string>("todas");
  const [generoFiltro, setGeneroFiltro] = useState<string>("todos");

  const modalidades = [
    "Futsal",
    "Vôlei",
    "Handebol",
    "Basquete",
    "Futebol de Campo",
  ];

  useEffect(() => {
    fetchPartidas();

    // Realtime updates
    const channel = supabase
      .channel('partidas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partidas'
        },
        () => {
          fetchPartidas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [modalidadeFiltro, generoFiltro]);

  const fetchPartidas = async () => {
    try {
      let query = supabase
        .from("partidas")
        .select(`
          *,
          turma_a:turma_a_id(nome_turma),
          turma_b:turma_b_id(nome_turma),
          vencedor:vencedor_id(nome_turma)
        `)
        .eq("status", "finalizada")
        .order("data_hora", { ascending: false })
        .limit(20);

      if (modalidadeFiltro !== "todas") {
        query = query.ilike("modalidade", `%${modalidadeFiltro}%`);
      }

      if (generoFiltro !== "todos") {
        query = query.eq("genero_modalidade", generoFiltro as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPartidas(data as any);
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl">Últimos Resultados</CardTitle>
          <div className="flex gap-2">
            <Select value={modalidadeFiltro} onValueChange={setModalidadeFiltro}>
              <SelectTrigger className="w-[140px] border-primary/30">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {modalidades.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={generoFiltro} onValueChange={setGeneroFiltro}>
              <SelectTrigger className="w-[130px] border-primary/30">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Misto">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {partidas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma partida encontrada com os filtros selecionados
            </div>
          ) : (
            partidas.map((partida) => (
              <div
                key={partida.id}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Data e Modalidade */}
                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(partida.data_hora), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(partida.data_hora), "HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <span className="text-primary font-medium">
                    {partida.modalidade} {partida.genero_modalidade}
                  </span>
                  <span className="text-xs">({partida.fase})</span>
                </div>

                {/* Placar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Turma A */}
                    <div
                      className={`flex-1 text-right ${
                        partida.vencedor?.nome_turma === partida.turma_a.nome_turma
                          ? "font-bold text-secondary"
                          : ""
                      }`}
                    >
                      <span className="text-lg">Turma {partida.turma_a.nome_turma}</span>
                    </div>

                    {/* Placar */}
                    <div className="flex items-center gap-2 px-6 py-2 bg-muted/50 rounded-lg">
                      {partida.wo_aplicado ? (
                        <span className="text-destructive font-bold text-sm">WO</span>
                      ) : (
                        <>
                          <span className={`text-2xl font-bold ${
                            partida.vencedor?.nome_turma === partida.turma_a.nome_turma
                              ? "text-secondary"
                              : ""
                          }`}>
                            {partida.placar_a ?? 0}
                          </span>
                          <span className="text-muted-foreground">×</span>
                          <span className={`text-2xl font-bold ${
                            partida.vencedor?.nome_turma === partida.turma_b.nome_turma
                              ? "text-secondary"
                              : ""
                          }`}>
                            {partida.placar_b ?? 0}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Turma B */}
                    <div
                      className={`flex-1 text-left ${
                        partida.vencedor?.nome_turma === partida.turma_b.nome_turma
                          ? "font-bold text-secondary"
                          : ""
                      }`}
                    >
                      <span className="text-lg">Turma {partida.turma_b.nome_turma}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
