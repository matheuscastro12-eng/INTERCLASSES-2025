import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

export function GestaoPenalidades() {
  const { profile } = useAuth();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [tipoPenalidade, setTipoPenalidade] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [valorPontos, setValorPontos] = useState("");
  const [valorMulta, setValorMulta] = useState("");
  const [artigo, setArtigo] = useState("");
  const [motivo, setMotivo] = useState("");

  const penalidades = [
    { value: "wo_esportivo", label: "WO Esportivo", campo: "pen_wo_esportivo", sugestao: "5 ou 10 pontos" },
    { value: "disciplinar", label: "Disciplinar", campo: "pen_disciplinar", sugestao: "5 ou 10 pontos" },
    { value: "nao_plantao", label: "Não entrega Plantão", campo: "pen_nao_plantao", sugestao: "10 pontos" },
    { value: "nao_calouro", label: "Não participação Calouro", campo: "pen_nao_calouro", sugestao: "R$100/aluno" },
  ];

  useEffect(() => {
    fetchTurmas();
    fetchLogs();
  }, []);

  const fetchTurmas = async () => {
    const { data } = await supabase.from("turmas").select("*").order("graduacao");
    setTurmas(data || []);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("penalidades_log")
      .select("*, turma:turmas(nome_turma)")
      .order("data_aplicacao", { ascending: false })
      .limit(20);
    setLogs(data || []);
  };

  const handleAplicarPenalidade = async () => {
    if (!tipoPenalidade || !turmaId || !artigo || !motivo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const penalidade = penalidades.find((p) => p.value === tipoPenalidade);
    if (!penalidade) return;

    try {
      // Buscar pontuação atual
      const { data: pontuacaoAtual } = await supabase
        .from("pontuacao_geral")
        .select(penalidade.campo)
        .eq("turma_id", turmaId)
        .single();

      // Calcular novo valor
      const valorAtual = pontuacaoAtual?.[penalidade.campo] || 0;
      const novoValor =
        tipoPenalidade === "nao_calouro"
          ? valorAtual + parseFloat(valorMulta || "0")
          : valorAtual + parseInt(valorPontos || "0");

      // Atualizar pontuação
      const updateData: any = {};
      updateData[penalidade.campo] = novoValor;

      const { error: updateError } = await supabase
        .from("pontuacao_geral")
        .update(updateData)
        .eq("turma_id", turmaId);

      if (updateError) throw updateError;

      // Registrar no log
      const { error: logError } = await supabase.from("penalidades_log").insert([
        {
          turma_id: turmaId,
          tipo_penalidade: tipoPenalidade,
          valor_pontos: tipoPenalidade !== "nao_calouro" ? parseInt(valorPontos || "0") : null,
          valor_multa: tipoPenalidade === "nao_calouro" ? parseFloat(valorMulta || "0") : null,
          artigo_regulamento: artigo,
          motivo: motivo,
          aplicado_por: profile?.id,
        },
      ]);

      if (logError) throw logError;

      toast.success("Penalidade aplicada com sucesso!");
      setTipoPenalidade("");
      setTurmaId("");
      setValorPontos("");
      setValorMulta("");
      setArtigo("");
      setMotivo("");
      fetchTurmas();
      fetchLogs();
    } catch (error) {
      console.error("Erro ao aplicar penalidade:", error);
      toast.error("Erro ao aplicar penalidade");
    }
  };

  const penSelecionada = penalidades.find((p) => p.value === tipoPenalidade);

  return (
    <div className="space-y-6">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Aplicar Penalidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
            <p className="text-sm">
              <strong>Penalidades por Tipo:</strong>
              <br />
              • WO: -5 pts (Art. 12º) ou -10 pts (Art. 90º)
              <br />
              • Disciplinar: -5 pts (grave) ou -10 pts (agressão/revide)
              <br />
              • Não Plantão: -10 pts (Art. 20º §3º)
              <br />• Não Calouro: R$100/aluno (Art. 3º)
            </p>
          </div>

          <div>
            <Label>Tipo de Penalidade *</Label>
            <Select value={tipoPenalidade} onValueChange={setTipoPenalidade}>
              <SelectTrigger className="border-primary/30">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {penalidades.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {penSelecionada && (
            <>
              {penSelecionada.value !== "nao_calouro" ? (
                <div>
                  <Label>Valor em Pontos * ({penSelecionada.sugestao})</Label>
                  <Input
                    type="number"
                    value={valorPontos}
                    onChange={(e) => setValorPontos(e.target.value)}
                    placeholder="Ex: 5 ou 10"
                    className="border-primary/30"
                  />
                </div>
              ) : (
                <div>
                  <Label>Valor da Multa (R$) * ({penSelecionada.sugestao})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMulta}
                    onChange={(e) => setValorMulta(e.target.value)}
                    placeholder="Ex: 100.00"
                    className="border-primary/30"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Artigo do Regulamento *</Label>
            <Input
              value={artigo}
              onChange={(e) => setArtigo(e.target.value)}
              placeholder="Ex: Art. 12º §4º"
              className="border-primary/30"
            />
          </div>

          <div>
            <Label>Motivo/Descrição *</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da penalidade..."
              className="border-primary/30"
            />
          </div>

          <Button
            onClick={handleAplicarPenalidade}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Aplicar Penalidade
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Penalidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma penalidade registrada
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold">Turma {log.turma.nome_turma}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(log.data_aplicacao).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <span className="text-xs bg-destructive/20 px-2 py-1 rounded">
                      {log.tipo_penalidade}
                    </span>
                  </div>
                  <div className="text-sm">
                    {log.valor_pontos && (
                      <span className="text-destructive font-bold">-{log.valor_pontos} pontos</span>
                    )}
                    {log.valor_multa && (
                      <span className="text-destructive font-bold">
                        Multa: R${log.valor_multa}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>{log.artigo_regulamento}:</strong> {log.motivo}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
