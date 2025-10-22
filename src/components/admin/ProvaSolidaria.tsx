import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Droplet } from "lucide-react";
import { toast } from "sonner";
import { ListaSolidaria } from "./ListaSolidaria";

export function ProvaSolidaria() {
  const { profile } = useAuth();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [kgAlimentos, setKgAlimentos] = useState("");
  const [percentualDoadores, setPercentualDoadores] = useState("");

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

  const handleSalvar = async () => {
    if (!turmaId) {
      toast.error("Selecione uma turma");
      return;
    }

    try {
      const updateData: any = {};
      
      if (kgAlimentos) {
        updateData.kg_alimentos = parseFloat(kgAlimentos);
      }
      
      if (percentualDoadores) {
        updateData.percentual_doadores_sangue = parseFloat(percentualDoadores);
      }

      const { error } = await supabase
        .from("pontuacao_geral")
        .update(updateData)
        .eq("turma_id", turmaId);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      setTurmaId("");
      setKgAlimentos("");
      setPercentualDoadores("");
      fetchTurmas();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar dados");
    }
  };

  return (
    <div className="space-y-6">
      <ListaSolidaria />
      
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            Gestão Prova Solidária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm">
              <strong>Regras:</strong>
              <br />
              • <strong>Doação de Sangue (Art. 88º):</strong> 5 pontos se atingir 10% de doadores
              <br />
              • <strong>Alimentos:</strong> Registre os KG arrecadados aqui
              <br />
              • <strong>Ranking de Alimentos:</strong> Use a aba específica para calcular
            </p>
          </div>

          <div>
            <Label>Turma *</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger className="border-primary/30">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Turma {t.nome_turma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>KG de Alimentos Arrecadados</Label>
            <Input
              type="number"
              step="0.01"
              value={kgAlimentos}
              onChange={(e) => setKgAlimentos(e.target.value)}
              placeholder="Ex: 150.5"
              className="border-primary/30"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-destructive" />
              Percentual de Doadores de Sangue (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={percentualDoadores}
              onChange={(e) => setPercentualDoadores(e.target.value)}
              placeholder="Ex: 10.5"
              className="border-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 10% para receber 5 pontos
            </p>
          </div>

          <Button onClick={handleSalvar} className="w-full bg-primary hover:bg-primary-glow">
            Salvar Dados
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Turmas */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Status por Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {turmas.map((t) => (
              <div key={t.id} className="p-3 bg-muted/20 rounded-lg flex justify-between items-center">
                <span className="font-bold">Turma {t.nome_turma}</span>
                <div className="text-sm text-muted-foreground space-x-4">
                  <span>{t.pontuacao?.[0]?.kg_alimentos || 0} kg</span>
                  <span>
                    {t.pontuacao?.[0]?.percentual_doadores_sangue || 0}% doadores ·{" "}
                    {t.pontuacao?.[0]?.pontos_sangue || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
