import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const modalidades = [
  "Futsal Masculino",
  "Futsal Feminino",
  "Vôlei Masculino",
  "Vôlei Feminino",
  "Handebol Masculino",
  "Handebol Feminino",
  "Basquete Masculino",
  "Basquete Feminino",
  "Queimada Misto",
  "Futebol de Campo Masculino",
];

export function GestaoAtletas() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [atletas, setAtletas] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [genero, setGenero] = useState("");
  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    fetchTurmas();
    fetchAtletas();
  }, []);

  const fetchTurmas = async () => {
    const { data } = await supabase.from("turmas").select("*").order("graduacao");
    setTurmas(data || []);
  };

  const fetchAtletas = async () => {
    const { data } = await supabase
      .from("atletas")
      .select("*, turma:turmas(nome_turma)")
      .order("nome_completo");
    setAtletas(data || []);
  };

  const handleAdd = async () => {
    if (!nome || !turmaId || !genero) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    const { error } = await supabase.from("atletas").insert([{
      nome_completo: nome,
      turma_id: turmaId,
      genero: genero as "Masculino" | "Feminino",
      modalidades_inscritas: modalidadesSelecionadas,
    }]);

    if (error) {
      toast.error("Erro ao adicionar atleta");
    } else {
      toast.success("Atleta adicionado!");
      setNome("");
      setTurmaId("");
      setGenero("");
      setModalidadesSelecionadas([]);
      fetchAtletas();
    }
  };

  const toggleModalidade = (modalidade: string) => {
    setModalidadesSelecionadas(prev => 
      prev.includes(modalidade) 
        ? prev.filter(m => m !== modalidade)
        : [...prev, modalidade]
    );
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("atletas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover atleta");
    } else {
      toast.success("Atleta removido!");
      fetchAtletas();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Adicionar Atleta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome Completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Turma</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>Turma {t.nome_turma}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Gênero</Label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Modalidades Inscritas (opcional)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border border-primary/30 rounded-md">
              {modalidades.map((mod) => (
                <div key={mod} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mod-${mod}`}
                    checked={modalidadesSelecionadas.includes(mod)}
                    onCheckedChange={() => toggleModalidade(mod)}
                  />
                  <label
                    htmlFor={`mod-${mod}`}
                    className="text-xs cursor-pointer"
                  >
                    {mod}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Lista de Atletas ({atletas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {atletas.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                <div className="flex-1">
                  <span className="font-medium">{a.nome_completo}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Turma {a.turma.nome_turma} · {a.genero}
                  </span>
                  {a.modalidades_inscritas && a.modalidades_inscritas.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Modalidades: {a.modalidades_inscritas.join(", ")}
                    </div>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
