import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string | null;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile after auth change
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil para:', userId);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("❌ Erro ao buscar perfil:", profileError);
        throw profileError;
      }

      console.log('✅ Perfil encontrado:', profileData);

      // Preferir função RPC has_role (SECURITY DEFINER) para evitar problemas de RLS
      const { data: hasAdminRole, error: rpcError } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      if (rpcError) {
        console.warn('⚠️ Falha ao usar has_role RPC, tentando fallback:', rpcError);
      }

      let isAdmin = hasAdminRole === true;

      // Fallback: consulta direta à tabela user_roles caso RPC falhe
      if (!isAdmin && rpcError) {
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (rolesError) {
          console.error('❌ Erro ao buscar roles:', rolesError);
        } else {
          console.log('🔐 Roles encontradas (fallback):', rolesData);
          isAdmin = rolesData?.some((r: any) => r.role === 'admin') ?? false;
        }
      }

      console.log('👤 É admin?', isAdmin);

      setProfile({
        ...profileData,
        is_admin: isAdmin,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar dados do usuário:", error);
      // Se falhar, ainda preenche o perfil para não quebrar a UI
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        console.log('⚠️ Perfil encontrado mas sem role admin');
        setProfile({ ...profileData, is_admin: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Usar username diretamente como email (formato: username@warroom.local)
      const email = `${username}@warroom.local`;
      
      console.log('🔐 Tentando login:', { username, email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        return { error: new Error("Usuário ou senha inválidos") };
      }

      console.log('✅ Login bem-sucedido:', data.user?.email);
      return { error: null };
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      return { error: new Error("Erro ao fazer login") };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      // Criar email fictício baseado no username
      const email = `${username}@warroom.local`;
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
          },
        },
      });

      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.is_admin ?? false,
  };
}
