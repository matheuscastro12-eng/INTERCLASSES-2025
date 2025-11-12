export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      atletas: {
        Row: {
          created_at: string
          genero: Database["public"]["Enums"]["genero_tipo"]
          id: string
          modalidades_inscritas: string[] | null
          nome_completo: string
          prioridade_esporte: string | null
          turma_id: string
        }
        Insert: {
          created_at?: string
          genero: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidades_inscritas?: string[] | null
          nome_completo: string
          prioridade_esporte?: string | null
          turma_id: string
        }
        Update: {
          created_at?: string
          genero?: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidades_inscritas?: string[] | null
          nome_completo?: string
          prioridade_esporte?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atletas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      chaves_torneio: {
        Row: {
          created_at: string
          estrutura_chave: Json
          formato: string
          genero_modalidade: Database["public"]["Enums"]["genero_tipo"]
          id: string
          modalidade: string
          numero_times: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estrutura_chave?: Json
          formato: string
          genero_modalidade: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidade: string
          numero_times: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estrutura_chave?: Json
          formato?: string
          genero_modalidade?: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidade?: string
          numero_times?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partidas: {
        Row: {
          created_at: string
          data_hora: string | null
          detalhes_sumula: string | null
          fase: string
          genero_modalidade: Database["public"]["Enums"]["genero_tipo"]
          id: string
          modalidade: string
          placar_a: number | null
          placar_b: number | null
          status: Database["public"]["Enums"]["status_modalidade"] | null
          turma_a_id: string
          turma_b_id: string
          turma_wo_id: string | null
          vencedor_id: string | null
          wo_aplicado: boolean | null
        }
        Insert: {
          created_at?: string
          data_hora?: string | null
          detalhes_sumula?: string | null
          fase: string
          genero_modalidade: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidade: string
          placar_a?: number | null
          placar_b?: number | null
          status?: Database["public"]["Enums"]["status_modalidade"] | null
          turma_a_id: string
          turma_b_id: string
          turma_wo_id?: string | null
          vencedor_id?: string | null
          wo_aplicado?: boolean | null
        }
        Update: {
          created_at?: string
          data_hora?: string | null
          detalhes_sumula?: string | null
          fase?: string
          genero_modalidade?: Database["public"]["Enums"]["genero_tipo"]
          id?: string
          modalidade?: string
          placar_a?: number | null
          placar_b?: number | null
          status?: Database["public"]["Enums"]["status_modalidade"] | null
          turma_a_id?: string
          turma_b_id?: string
          turma_wo_id?: string | null
          vencedor_id?: string | null
          wo_aplicado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partidas_turma_a_id_fkey"
            columns: ["turma_a_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_turma_b_id_fkey"
            columns: ["turma_b_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_turma_wo_id_fkey"
            columns: ["turma_wo_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidas_vencedor_id_fkey"
            columns: ["vencedor_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      penalidades_log: {
        Row: {
          aplicado_por: string | null
          artigo_regulamento: string
          data_aplicacao: string
          id: string
          motivo: string
          tipo_penalidade: string
          turma_id: string
          valor_multa: number | null
          valor_pontos: number | null
        }
        Insert: {
          aplicado_por?: string | null
          artigo_regulamento: string
          data_aplicacao?: string
          id?: string
          motivo: string
          tipo_penalidade: string
          turma_id: string
          valor_multa?: number | null
          valor_pontos?: number | null
        }
        Update: {
          aplicado_por?: string | null
          artigo_regulamento?: string
          data_aplicacao?: string
          id?: string
          motivo?: string
          tipo_penalidade?: string
          turma_id?: string
          valor_multa?: number | null
          valor_pontos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "penalidades_log_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      pontuacao_geral: {
        Row: {
          cestas_basicas_entregues: number | null
          kg_alimentos: number | null
          multa_cestas_faltantes: number | null
          pen_disciplinar: number | null
          pen_nao_calouro: number | null
          pen_nao_plantao: number | null
          pen_wo_esportivo: number | null
          percentual_doadores_sangue: number | null
          pontos_alimentos: number | null
          pontos_esportivos: number | null
          pontos_sangue: number | null
          total_pontos: number | null
          turma_id: string
          updated_at: string
        }
        Insert: {
          cestas_basicas_entregues?: number | null
          kg_alimentos?: number | null
          multa_cestas_faltantes?: number | null
          pen_disciplinar?: number | null
          pen_nao_calouro?: number | null
          pen_nao_plantao?: number | null
          pen_wo_esportivo?: number | null
          percentual_doadores_sangue?: number | null
          pontos_alimentos?: number | null
          pontos_esportivos?: number | null
          pontos_sangue?: number | null
          total_pontos?: number | null
          turma_id: string
          updated_at?: string
        }
        Update: {
          cestas_basicas_entregues?: number | null
          kg_alimentos?: number | null
          multa_cestas_faltantes?: number | null
          pen_disciplinar?: number | null
          pen_nao_calouro?: number | null
          pen_nao_plantao?: number | null
          pen_wo_esportivo?: number | null
          percentual_doadores_sangue?: number | null
          pontos_alimentos?: number | null
          pontos_esportivos?: number | null
          pontos_sangue?: number | null
          total_pontos?: number | null
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontuacao_geral_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: true
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      pontuacao_solidaria_logs: {
        Row: {
          data_alteracao: string
          id: string
          motivo_alteracao: string
          turma_id: string
          usuario_admin_id: string | null
          valor_anterior: Json | null
          valor_novo: Json
        }
        Insert: {
          data_alteracao?: string
          id?: string
          motivo_alteracao: string
          turma_id: string
          usuario_admin_id?: string | null
          valor_anterior?: Json | null
          valor_novo: Json
        }
        Update: {
          data_alteracao?: string
          id?: string
          motivo_alteracao?: string
          turma_id?: string
          usuario_admin_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pontuacao_solidaria_logs_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
      turmas: {
        Row: {
          calouro: boolean
          created_at: string
          graduacao: number
          id: string
          internato: boolean
          nome_turma: string
          sexto_ano: boolean
        }
        Insert: {
          calouro?: boolean
          created_at?: string
          graduacao: number
          id?: string
          internato?: boolean
          nome_turma: string
          sexto_ano?: boolean
        }
        Update: {
          calouro?: boolean
          created_at?: string
          graduacao?: number
          id?: string
          internato?: boolean
          nome_turma?: string
          sexto_ano?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_wo: {
        Args: { partida_uuid: string; turma_uuid: string }
        Returns: undefined
      }
      calculate_total_pontos: { Args: { turma_uuid: string }; Returns: number }
      calculate_total_pontos_v2: {
        Args: { turma_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      genero_tipo: "Masculino" | "Feminino" | "Outro"
      status_modalidade:
        | "agendada"
        | "em_andamento"
        | "finalizada"
        | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      genero_tipo: ["Masculino", "Feminino", "Outro"],
      status_modalidade: [
        "agendada",
        "em_andamento",
        "finalizada",
        "cancelada",
      ],
    },
  },
} as const
