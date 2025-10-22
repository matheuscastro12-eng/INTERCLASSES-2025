import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, List } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ListaPartidas() {
  const [partidas, setPartidas] = useState<any[]>([]);
  const [editandoPartida, setEditandoPartida] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPartidas();
  }, []);

  const fetchPartidas = async () => {
    const { data } = await supabase
      .from("partidas")
      .select(`
        *,
        turma_a:turmas!partidas_turma_a_id_fkey(nome_turma),
        turma_b:turmas!partidas_turma_b_id_fkey(nome_turma),
        vencedor:turmas!partidas_vencedor_id_fkey(nome_turma)
      `)
      .order("data_hora", { ascending: false });
    setPartidas(data || []);
  };

  const handleDelete = async (id: string, partidaData: any) => {
    if (!confirm("Tem certeza que deseja excluir esta partida? Isso afetará a pontuação.")) return;

    try {
      // Reverter pontos se não foi WO
      if (!partidaData.wo_aplicado && partidaData.vencedor_id) {
        const { data: pontuacaoAtual } = await supabase
          .from("pontuacao_geral")
          .select("pontos_esportivos")
          .eq("turma_id", partidaData.vencedor_id)
          .single();

        await supabase
          .from("pontuacao_geral")
          .update({ pontos_esportivos: Math.max(0, (pontuacaoAtual?.pontos_esportivos || 0) - 3) })
          .eq("turma_id", partidaData.vencedor_id);
      } else if (!partidaData.wo_aplicado && partidaData.placar_a === partidaData.placar_b) {
        // Empate - reverter 1 ponto de cada
        const turmasIds = [partidaData.turma_a_id, partidaData.turma_b_id];
        for (const turmaId of turmasIds) {
          const { data: pontuacaoAtual } = await supabase
            .from("pontuacao_geral")
            .select("pontos_esportivos")
            .eq("turma_id", turmaId)
            .single();

          await supabase
            .from("pontuacao_geral")
            .update({ pontos_esportivos: Math.max(0, (pontuacaoAtual?.pontos_esportivos || 0) - 1) })
            .eq("turma_id", turmaId);
        }
      }

      // Reverter WO se aplicado
      if (partidaData.wo_aplicado && partidaData.turma_wo_id) {
        const { data: pontuacaoAtual } = await supabase
          .from("pontuacao_geral")
          .select("pen_wo_esportivo")
          .eq("turma_id", partidaData.turma_wo_id)
          .single();

        await supabase
          .from("pontuacao_geral")
          .update({ pen_wo_esportivo: Math.max(0, (pontuacaoAtual?.pen_wo_esportivo || 0) - 5) })
          .eq("turma_id", partidaData.turma_wo_id);
      }

      // Deletar partida
      const { error } = await supabase.from("partidas").delete().eq("id", id);
      if (error) throw error;

      toast.success("Partida excluída e pontuação revertida!");
      fetchPartidas();
    } catch (error) {
      console.error("Erro ao excluir partida:", error);
      toast.error("Erro ao excluir partida");
    }
  };

  const handleEdit = (partida: any) => {
    setEditandoPartida({
      ...partida,
      placar_a: partida.placar_a || 0,
      placar_b: partida.placar_b || 0,
    });
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editandoPartida) return;

    try {
      // Reverter pontos antigos
      const partidaOriginal = partidas.find(p => p.id === editandoPartida.id);
      if (partidaOriginal && !partidaOriginal.wo_aplicado && partidaOriginal.vencedor_id) {
        const { data: pontuacaoAtual } = await supabase
          .from("pontuacao_geral")
          .select("pontos_esportivos")
          .eq("turma_id", partidaOriginal.vencedor_id)
          .single();

        await supabase
          .from("pontuacao_geral")
          .update({ pontos_esportivos: Math.max(0, (pontuacaoAtual?.pontos_esportivos || 0) - 3) })
          .eq("turma_id", partidaOriginal.vencedor_id);
      }

      // Calcular novo vencedor
      const pA = parseInt(editandoPartida.placar_a) || 0;
      const pB = parseInt(editandoPartida.placar_b) || 0;
      const novoVencedor = pA > pB ? editandoPartida.turma_a_id : pB > pA ? editandoPartida.turma_b_id : null;

      // Atualizar partida
      const { error } = await supabase
        .from("partidas")
        .update({
          placar_a: pA,
          placar_b: pB,
          vencedor_id: novoVencedor,
          detalhes_sumula: editandoPartida.detalhes_sumula,
        })
        .eq("id", editandoPartida.id);

      if (error) throw error;

      // Aplicar novos pontos
      if (novoVencedor) {
        const { data: pontuacaoAtual } = await supabase
          .from("pontuacao_geral")
          .select("pontos_esportivos")
          .eq("turma_id", novoVencedor)
          .single();

        await supabase
          .from("pontuacao_geral")
          .update({ pontos_esportivos: (pontuacaoAtual?.pontos_esportivos || 0) + 3 })
          .eq("turma_id", novoVencedor);
      } else if (pA === pB) {
        // Empate - 1 ponto para cada
        const turmasIds = [editandoPartida.turma_a_id, editandoPartida.turma_b_id];
        for (const turmaId of turmasIds) {
          const { data: pontuacaoAtual } = await supabase
            .from("pontuacao_geral")
            .select("pontos_esportivos")
            .eq("turma_id", turmaId)
            .single();

          await supabase
            .from("pontuacao_geral")
            .update({ pontos_esportivos: (pontuacaoAtual?.pontos_esportivos || 0) + 1 })
            .eq("turma_id", turmaId);
        }
      }

      toast.success("Partida atualizada com sucesso!");
      setDialogOpen(false);
      setEditandoPartida(null);
      fetchPartidas();
    } catch (error) {
      console.error("Erro ao atualizar partida:", error);
      toast.error("Erro ao atualizar partida");
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5 text-primary" />
          Partidas Registradas ({partidas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {partidas.map((p) => (
            <div key={p.id} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.modalidade} - {p.fase}</div>
                  <div className="text-sm mt-1">
                    <span className={p.vencedor_id === p.turma_a_id ? "font-bold text-primary" : ""}>
                      Turma {p.turma_a.nome_turma}
                    </span>
                    {" "}
                    {p.wo_aplicado ? (
                      <span className="text-destructive font-bold">WO</span>
                    ) : (
                      <span className="font-bold">{p.placar_a} x {p.placar_b}</span>
                    )}
                    {" "}
                    <span className={p.vencedor_id === p.turma_b_id ? "font-bold text-primary" : ""}>
                      Turma {p.turma_b.nome_turma}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(p.data_hora).toLocaleString("pt-BR")}
                  </div>
                  {p.detalhes_sumula && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      {p.detalhes_sumula}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!p.wo_aplicado && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id, p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Partida</DialogTitle>
            </DialogHeader>
            {editandoPartida && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Placar Turma {editandoPartida.turma_a?.nome_turma}</Label>
                    <Input
                      type="number"
                      value={editandoPartida.placar_a}
                      onChange={(e) =>
                        setEditandoPartida({ ...editandoPartida, placar_a: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Placar Turma {editandoPartida.turma_b?.nome_turma}</Label>
                    <Input
                      type="number"
                      value={editandoPartida.placar_b}
                      onChange={(e) =>
                        setEditandoPartida({ ...editandoPartida, placar_b: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Detalhes da Súmula</Label>
                  <Textarea
                    value={editandoPartida.detalhes_sumula || ""}
                    onChange={(e) =>
                      setEditandoPartida({ ...editandoPartida, detalhes_sumula: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveEdit} className="w-full">
                  Salvar Alterações
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
