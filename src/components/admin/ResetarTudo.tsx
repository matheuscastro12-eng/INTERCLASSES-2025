import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ResetarTudo() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetarTudo = async () => {
    setResetting(true);
    try {
      // Deletar todos os atletas
      await supabase.from("atletas").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Deletar todas as partidas
      await supabase.from("partidas").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Deletar todas as penalidades
      await supabase.from("penalidades_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Resetar pontuação geral
      await supabase.from("pontuacao_geral").update({
        pontos_esportivos: 0,
        pontos_alimentos: 0,
        pontos_sangue: 0,
        pen_wo_esportivo: 0,
        pen_nao_plantao: 0,
        pen_disciplinar: 0,
        kg_alimentos: 0,
        cestas_basicas_entregues: 0,
        percentual_doadores_sangue: 0,
        multa_cestas_faltantes: 0,
        total_pontos: 0,
      }).neq("turma_id", "00000000-0000-0000-0000-000000000000");

      toast.success("Sistema resetado com sucesso!");
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao resetar:", error);
      toast.error("Erro ao resetar o sistema");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Resetar Sistema (Zona de Perigo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ação irá <strong className="text-destructive">APAGAR PERMANENTEMENTE</strong>:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Todos os atletas cadastrados</li>
            <li>Todas as partidas registradas</li>
            <li>Todas as penalidades aplicadas</li>
            <li>Todas as pontuações (esportivas, alimentos, doação de sangue)</li>
          </ul>
          <p className="text-sm text-destructive font-semibold">
            ⚠️ Esta ação NÃO pode ser desfeita!
          </p>
          <Button
            variant="destructive"
            onClick={() => setDialogOpen(true)}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Resetar Todo o Sistema
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai <strong>APAGAR TODOS OS DADOS</strong> do sistema:
              atletas, partidas, penalidades e pontuações. Esta ação é
              irreversível e NÃO pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetarTudo}
              disabled={resetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {resetting ? "Resetando..." : "Sim, resetar tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
