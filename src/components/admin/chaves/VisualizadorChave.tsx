import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trophy } from "lucide-react";
import { CriadorChave } from "./CriadorChave";
import { BracketVisualizacao } from "./BracketVisualizacao";

type ChaveTorneio = {
  id: string;
  modalidade: string;
  genero_modalidade: string;
  formato: string;
  numero_times: number;
  estrutura_chave: any;
  status: string;
};

type VisualizadorChaveProps = {
  chave: ChaveTorneio;
  onVoltar: () => void;
};

export function VisualizadorChave({ chave, onVoltar }: VisualizadorChaveProps) {
  const [modoEdicao, setModoEdicao] = useState(chave.status === "rascunho");

  const handleSalvar = () => {
    setModoEdicao(false);
    onVoltar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{chave.modalidade}</h2>
            <p className="text-sm text-muted-foreground">
              {chave.formato.replace(/_/g, " ").toUpperCase()} · {chave.numero_times} times
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={chave.status === "ativo" ? "default" : "secondary"}>
            {chave.status.toUpperCase()}
          </Badge>
          {chave.status === "ativo" && (
            <Button variant="outline" onClick={() => setModoEdicao(!modoEdicao)}>
              <Edit className="mr-2 h-4 w-4" />
              {modoEdicao ? "Visualizar" : "Editar"}
            </Button>
          )}
        </div>
      </div>

      {chave.status === "rascunho" || modoEdicao ? (
        <CriadorChave
          chaveId={chave.id}
          numeroTimes={chave.numero_times}
          onSalvar={handleSalvar}
        />
      ) : (
        <BracketVisualizacao chave={chave} onAtualizar={onVoltar} />
      )}
    </div>
  );
}
