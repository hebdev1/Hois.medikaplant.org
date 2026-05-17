export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_impersonation_logs: {
        Row: {
          admin_id: string
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          target_user_id: string
        }
        Insert: {
          admin_id: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id: string
        }
        Update: {
          admin_id?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_impersonation_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar: number | null
          created_at: string
          heart_rate: number | null
          id: string
          logged_at: string
          notes: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          created_at?: string
          heart_rate?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          created_at?: string
          heart_rate?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link_url: string | null
          message: string
          target: Database["public"]["Enums"]["notification_target"]
          target_plan: Database["public"]["Enums"]["plan_type"] | null
          target_user_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_url?: string | null
          message: string
          target?: Database["public"]["Enums"]["notification_target"]
          target_plan?: Database["public"]["Enums"]["plan_type"] | null
          target_user_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link_url?: string | null
          message?: string
          target?: Database["public"]["Enums"]["notification_target"]
          target_plan?: Database["public"]["Enums"]["plan_type"] | null
          target_user_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          role: Database["public"]["Enums"]["user_role"]
          suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["plan_type"]
          role?: Database["public"]["Enums"]["user_role"]
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          role?: Database["public"]["Enums"]["user_role"]
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      resource_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          last_accessed_at: string
          progress_percent: number
          resource_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          last_accessed_at?: string
          progress_percent?: number
          resource_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          last_accessed_at?: string
          progress_percent?: number
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          drip_release_at: string | null
          duration_seconds: number | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          plan_required: Database["public"]["Enums"]["plan_type"]
          published: boolean
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drip_release_at?: string | null
          duration_seconds?: number | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          published?: boolean
          thumbnail_url?: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drip_release_at?: string | null
          duration_seconds?: number | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          published?: boolean
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          end_date: string | null
          id: string
          payment_reference: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_reference?: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_reference?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["plan_type"]
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      plan_rank: {
        Args: { p: Database["public"]["Enums"]["plan_type"] }
        Returns: number
      }
    }
    Enums: {
      notification_target: "all" | "plan" | "user"
      plan_type: "basic" | "premium" | "vip"
      resource_type: "pdf" | "video" | "audio"
      subscription_status: "active" | "cancelled" | "expired"
      user_role: "user" | "admin"
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

// Convenience aliases
export type Plan = Database["public"]["Enums"]["plan_type"]
export type Role = Database["public"]["Enums"]["user_role"]
export type Profile = Tables<"profiles">
export type Resource = Tables<"resources">
export type HealthLog = Tables<"health_logs">
export type Notification = Tables<"notifications">
export type Subscription = Tables<"subscriptions">
