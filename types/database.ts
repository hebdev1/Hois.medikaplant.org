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
        Relationships: []
      }
      badges: {
        Row: {
          active: boolean
          created_at: string
          criteria_metric: string
          criteria_threshold: number
          display_order: number
          icon: string
          id: string
          name: string
          slug: string
          sub: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          criteria_metric?: string
          criteria_threshold?: number
          display_order?: number
          icon?: string
          id?: string
          name: string
          slug: string
          sub?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          criteria_metric?: string
          criteria_threshold?: number
          display_order?: number
          icon?: string
          id?: string
          name?: string
          slug?: string
          sub?: string | null
        }
        Relationships: []
      }
      daily_advice: {
        Row: {
          audio_url: string | null
          body_html: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          id: string
          plan_required: Database["public"]["Enums"]["plan_type"]
          plant_name: string | null
          publish_date: string
        }
        Insert: {
          audio_url?: string | null
          body_html: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          plant_name?: string | null
          publish_date: string
        }
        Update: {
          audio_url?: string | null
          body_html?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          plant_name?: string | null
          publish_date?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          botanical: string | null
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          name: string
          old_price: number | null
          plan_recommendation: Database["public"]["Enums"]["plan_type"] | null
          price: number
          shipping_note: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          botanical?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name: string
          old_price?: number | null
          plan_recommendation?: Database["public"]["Enums"]["plan_type"] | null
          price: number
          shipping_note?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          botanical?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name?: string
          old_price?: number | null
          plan_recommendation?: Database["public"]["Enums"]["plan_type"] | null
          price?: number
          shipping_note?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
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
      program_tasks: {
        Row: {
          chip_kind: string
          chip_label: string | null
          created_at: string
          id: string
          meta: string | null
          order_index: number
          program_id: string
          title: string
        }
        Insert: {
          chip_kind?: string
          chip_label?: string | null
          created_at?: string
          id?: string
          meta?: string | null
          order_index: number
          program_id: string
          title: string
        }
        Update: {
          chip_kind?: string
          chip_label?: string | null
          created_at?: string
          id?: string
          meta?: string | null
          order_index?: number
          program_id?: string
          title?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          hero_color: string | null
          id: string
          name: string
          plan_required: Database["public"]["Enums"]["plan_type"]
          slug: string
          total_days: number
          updated_at: string
          variant: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          hero_color?: string | null
          id?: string
          name: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          slug: string
          total_days?: number
          updated_at?: string
          variant?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          hero_color?: string | null
          id?: string
          name?: string
          plan_required?: Database["public"]["Enums"]["plan_type"]
          slug?: string
          total_days?: number
          updated_at?: string
          variant?: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          just_unlocked: boolean
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          just_unlocked?: boolean
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          just_unlocked?: boolean
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_programs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          is_active: boolean
          program_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          is_active?: boolean
          program_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          is_active?: boolean
          program_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_task_completions: {
        Row: {
          completed_at: string
          completion_date: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completion_date?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completion_date?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
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
      recompute_user_badges: { Args: { uid: string }; Returns: undefined }
      user_level: { Args: { uid: string }; Returns: number }
      user_level_name: { Args: { uid: string }; Returns: string }
      user_streak: { Args: { uid: string }; Returns: number }
      user_unread_notifications_count: {
        Args: { uid: string }
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
    CompositeTypes: { [_ in never]: never }
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
export type Program = Tables<"programs">
export type ProgramTask = Tables<"program_tasks">
export type UserProgram = Tables<"user_programs">
export type UserTaskCompletion = Tables<"user_task_completions">
export type Badge = Tables<"badges">
export type UserBadge = Tables<"user_badges">
export type DailyAdvice = Tables<"daily_advice">
export type Product = Tables<"products">

// Allowed icon values for badges
export type BadgeIcon =
  | 'sprout'
  | 'leaf'
  | 'droplet'
  | 'flame'
  | 'activity'
  | 'target'
  | 'calendar'
  | 'star'

// Allowed chip kinds for tasks
export type TaskChipKind = 'forest' | 'gold' | 'cream'
