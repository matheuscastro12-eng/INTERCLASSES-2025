import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListaPartidas } from "./ListaPartidas";
import { partidaSchema } from "@/lib/validations";

const modalidades = [
  "Futsal Masculino",
  "Futsal Feminino",
  "Vôlei Masculino",
  "Vôlei Feminino",
  "Handebol Masculino",
  "Handebol Feminino",
  "Basquete Masculino",
  "Basquete Feminino",
  "Futebol de Campo Masculino",
  "Pebolim",
  "Sinuca",
  "Xadrez",
];

const fases = [
  "Fase de Grupos",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Final",
  "Disputa de 3º Lugar",
];

export function RegistroSumula() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [modalidade, setModalidade] = useState("");
  const [fase, setFase] = useState("");
  const [turmaAId, setTurmaAId] = useState("");
  const [turmaBId, setTurmaBId] = useState("");
  const [placarA, setPlacarA] = useState("");
  const [placarB, setPlacarB] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [woMode, setWoMode] = useState(false);
  const [turmaWoId, setTurmaWoId] = useState("");

  useEffect(() => {
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    const { data } = await supabase.from("turmas").select("*").order("graduacao");
    setTurmas(data || []);
  };

  const handleRegistrarResultado = async () => {
    if (turmaAId === turmaBId) {
      toast.error("Selecione turmas diferentes");
      return;
    }

    const pA = parseInt(placarA) || 0;
    const pB = parseInt(placarB) || 0;

    try {
      // Validate input
      const genero = modalidade.includes("Masculino")
        ? "M"
        : modalidade.includes("Feminino")
        ? "F"
        : "Misto" as "M" | "F" | "Misto";

      const validation = partidaSchema.safeParse({
        turma_a_id: turmaAId,
        turma_b_id: turmaBId,
        placar_a: pA,
        placar_b: pB,
        modalidade,
        genero_modalidade: genero,
        fase,
        data_hora: dataHora || undefined,
        detalhes_sumula: detalhes || undefined,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const generoDb = modalidade.includes("Masculino")
        ? "Masculino"
        : modalidade.includes("Feminino")
        ? "Feminino"
        : "Outro" as "Masculino" | "Feminino" | "Outro";

      let vencedorId = null;

      if (!woMode) {
        vencedorId = pA > pB ? turmaAId : pB > pA ? turmaBId : null;

        // Adicionar pontos esportivos (vitória = 3 pontos por partida, empate = 1 ponto)
        if (vencedorId) {
          const { data: pontuacaoAtual } = await supabase
            .from("pontuacao_geral")
            .select("pontos_esportivos")
            .eq("turma_id", vencedorId)
            .single();

          await supabase
            .from("pontuacao_geral")
            .update({ pontos_esportivos: (pontuacaoAtual?.pontos_esportivos || 0) + 3 })
            .eq("turma_id", vencedorId);
        } else if (pA === pB) {
          // Empate - 1 ponto para cada
          const { data: pontuacoesAtuais } = await supabase
            .from("pontuacao_geral")
            .select("turma_id, pontos_esportivos")
            .in("turma_id", [turmaAId, turmaBId]);

          for (const pontuacao of pontuacoesAtuais || []) {
            await supabase
              .from("pontuacao_geral")
              .update({ pontos_esportivos: (pontuacao.pontos_esportivos || 0) + 1 })
              .eq("turma_id", pontuacao.turma_id);
          }
        }
      } else {
        // Modo WO
        if (!turmaWoId) {
          toast.error("Selecione a turma que levou WO");
          return;
        }
        vencedorId = turmaWoId === turmaAId ? turmaBId : turmaAId;
      }

      // Inserir partida
      const { data: partida, error: partidaError } = await supabase
        .from("partidas")
        .insert([
          {
            modalidade,
            genero_modalidade: generoDb,
            fase,
            data_hora: dataHora || null,
            turma_a_id: turmaAId,
            turma_b_id: turmaBId,
            placar_a: woMode ? 0 : pA,
            placar_b: woMode ? 0 : pB,
            vencedor_id: vencedorId,
            wo_aplicado: woMode,
            turma_wo_id: woMode ? turmaWoId : null,
            detalhes_sumula: detalhes,
            status: "finalizada",
          },
        ])
        .select()
        .single();

      if (partidaError) throw partidaError;

      // Se WO, aplicar penalidade
      if (woMode && turmaWoId) {
        await supabase.rpc("aplicar_wo", {
          turma_uuid: turmaWoId,
          partida_uuid: partida.id,
        });
      }

      toast.success("Resultado registrado com sucesso!");
      
      // Limpar formulário
      setModalidade("");
      setFase("");
      setTurmaAId("");
      setTurmaBId("");
      setPlacarA("");
      setPlacarB("");
      setDetalhes("");
      setWoMode(false);
      setTurmaWoId("");
      setDataHora("");
    } catch (error) {
      console.error("Erro ao registrar resultado:", error);
      toast.error("Erro ao registrar resultado");
    }
  };

  return (
    <div className="space-y-6">
      <ListaPartidas />
      
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            Registro de Súmula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Modalidade *</Label>
              <Select value={modalidade} onValueChange={setModalidade}>
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {modalidades.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fase *</Label>
              <Select value={fase} onValueChange={setFase}>
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fases.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data e Hora (opcional)</Label>
              <Input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="border-primary/30"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="wo-mode"
                checked={woMode}
                onChange={(e) => setWoMode(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="wo-mode" className="cursor-pointer">
                Aplicar WO (-5 pontos + R$150)
              </Label>
            </div>
          </div>

          {woMode && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                Modo WO ativado: Selecione a turma que NÃO compareceu e será penalizada
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Turma A */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <Label>Turma A *</Label>
              <Select value={turmaAId} onValueChange={setTurmaAId}>
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Turma {t.nome_turma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!woMode && (
                <>
                  <Label>Placar A</Label>
                  <Input
                    type="number"
                    value={placarA}
                    onChange={(e) => setPlacarA(e.target.value)}
                    min="0"
                    className="border-primary/30"
                  />
                </>
              )}
            </div>

            {/* Turma B */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <Label>Turma B *</Label>
              <Select value={turmaBId} onValueChange={setTurmaBId}>
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Turma {t.nome_turma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!woMode && (
                <>
                  <Label>Placar B</Label>
                  <Input
                    type="number"
                    value={placarB}
                    onChange={(e) => setPlacarB(e.target.value)}
                    min="0"
                    className="border-primary/30"
                  />
                </>
              )}
            </div>
          </div>

          {woMode && (
            <div>
              <Label>Turma que levou WO (não compareceu) *</Label>
              <Select value={turmaWoId} onValueChange={setTurmaWoId}>
                <SelectTrigger className="border-destructive/50">
                  <SelectValue placeholder="Selecione a turma penalizada" />
                </SelectTrigger>
                <SelectContent>
                  {turmaAId && (
                    <SelectItem value={turmaAId}>
                      Turma {turmas.find((t) => t.id === turmaAId)?.nome_turma}
                    </SelectItem>
                  )}
                  {turmaBId && (
                    <SelectItem value={turmaBId}>
                      Turma {turmas.find((t) => t.id === turmaBId)?.nome_turma}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Detalhes da Súmula (opcional)</Label>
            <Textarea
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Observações, melhores jogadores, cartões, etc..."
              className="border-primary/30 min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {detalhes.length}/1000 caracteres
            </p>
          </div>

          <Button onClick={handleRegistrarResultado} className="w-full bg-primary hover:bg-primary-glow shadow-glow">
            <Save className="mr-2 h-4 w-4" />
            Registrar Resultado
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
