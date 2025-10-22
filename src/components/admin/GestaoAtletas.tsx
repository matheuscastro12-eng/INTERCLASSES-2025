import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function GestaoAtletas() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [atletas, setAtletas] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [genero, setGenero] = useState("");

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
    if (!nome || !turmaId || !genero) return;
    
    const { error } = await supabase.from("atletas").insert([{
      nome_completo: nome,
      turma_id: turmaId,
      genero: genero as "Masculino" | "Feminino",
    }]);

    if (error) {
      toast.error("Erro ao adicionar atleta");
    } else {
      toast.success("Atleta adicionado!");
      setNome("");
      setTurmaId("");
      setGenero("");
      fetchAtletas();
    }
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
                <div>
                  <span className="font-medium">{a.nome_completo}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Turma {a.turma.nome_turma} · {a.genero}
                  </span>
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
