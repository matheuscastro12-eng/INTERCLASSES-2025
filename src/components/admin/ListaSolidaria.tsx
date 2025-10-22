import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ListaSolidaria() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [editando, setEditando] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    const { data } = await supabase
      .from("pontuacao_geral")
      .select(`
        *,
        turma:turmas(nome_turma)
      `)
      .or("kg_alimentos.gt.0,percentual_doadores_sangue.gt.0")
      .order("kg_alimentos", { ascending: false });
    setRegistros(data || []);
  };

  const handleEdit = (registro: any) => {
    setEditando(registro);
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editando) return;

    try {
      const { error } = await supabase
        .from("pontuacao_geral")
        .update({
          kg_alimentos: parseFloat(editando.kg_alimentos) || 0,
          percentual_doadores_sangue: parseFloat(editando.percentual_doadores_sangue) || 0,
        })
        .eq("turma_id", editando.turma_id);

      if (error) throw error;

      toast.success("Registro atualizado!");
      setDialogOpen(false);
      setEditando(null);
      fetchRegistros();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar registro");
    }
  };

  const handleDelete = async (turmaId: string) => {
    if (!confirm("Tem certeza que deseja zerar estes registros?")) return;

    try {
      const { error } = await supabase
        .from("pontuacao_geral")
        .update({
          kg_alimentos: 0,
          percentual_doadores_sangue: 0,
          pontos_alimentos: 0,
          pontos_sangue: 0,
        })
        .eq("turma_id", turmaId);

      if (error) throw error;

      toast.success("Registros zerados!");
      fetchRegistros();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao deletar registro");
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" />
          Registros de Prova Solidária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {registros.map((r) => (
            <div key={r.turma_id} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold">Turma {r.turma.nome_turma}</div>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    <div>🥫 Alimentos: {r.kg_alimentos} kg ({r.pontos_alimentos} pontos)</div>
                    <div>💉 Doadores: {r.percentual_doadores_sangue}% ({r.pontos_sangue} pontos)</div>
                    {r.cestas_basicas_entregues > 0 && (
                      <div>🛒 Cestas: {r.cestas_basicas_entregues}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(r)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(r.turma_id)}>
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
              <DialogTitle>Editar Registros - Turma {editando?.turma?.nome_turma}</DialogTitle>
            </DialogHeader>
            {editando && (
              <div className="space-y-4">
                <div>
                  <Label>KG de Alimentos</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editando.kg_alimentos}
                    onChange={(e) =>
                      setEditando({ ...editando, kg_alimentos: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Percentual de Doadores (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editando.percentual_doadores_sangue}
                    onChange={(e) =>
                      setEditando({ ...editando, percentual_doadores_sangue: e.target.value })
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
