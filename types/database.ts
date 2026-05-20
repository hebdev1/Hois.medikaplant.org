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
      consultations: {
        Row: {
          consultant_name: string
          consultant_role: string | null
          cost: number | null
          created_at: string
          duration_minutes: number | null
          follow_up_at: string | null
          id: string
          meeting_url: string | null
          notes: string | null
          prescription: string | null
          recommendations: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["consultation_status"]
          topic: string | null
          type: Database["public"]["Enums"]["consultation_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          consultant_name: string
          consultant_role?: string | null
          cost?: number | null
          created_at?: string
          duration_minutes?: number | null
          follow_up_at?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          prescription?: string | null
          recommendations?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["consultation_status"]
          topic?: string | null
          type?: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          consultant_name?: string
          consultant_role?: string | null
          cost?: number | null
          created_at?: string
          duration_minutes?: number | null
          follow_up_at?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          prescription?: string | null
          recommendations?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["consultation_status"]
          topic?: string | null
          type?: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string
          user_id?: string
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
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          postal_code: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          suspended: boolean
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          postal_code?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_medical_info: {
        Row: {
          allergies: string | null
          blood_type: string | null
          chronic_diseases: string | null
          conditions: string[]
          doctor_name: string | null
          doctor_phone: string | null
          health_goal: string | null
          health_goal_other: string | null
          height_cm: number | null
          medications: string | null
          notes: string | null
          past_surgeries: string | null
          preferred_pharmacy: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          chronic_diseases?: string | null
          conditions?: string[]
          doctor_name?: string | null
          doctor_phone?: string | null
          health_goal?: string | null
          health_goal_other?: string | null
          height_cm?: number | null
          medications?: string | null
          notes?: string | null
          past_surgeries?: string | null
          preferred_pharmacy?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          chronic_diseases?: string | null
          conditions?: string[]
          doctor_name?: string | null
          doctor_phone?: string | null
          health_goal?: string | null
          health_goal_other?: string | null
          height_cm?: number | null
          medications?: string | null
          notes?: string | null
          past_surgeries?: string | null
          preferred_pharmacy?: string | null
          updated_at?: string
          user_id?: string
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
      support_contacts: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          href: string | null
          id: string
          kind: Database["public"]["Enums"]["support_contact_kind"]
          label: string
          sub_label: string | null
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          href?: string | null
          id?: string
          kind: Database["public"]["Enums"]["support_contact_kind"]
          label: string
          sub_label?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          href?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["support_contact_kind"]
          label?: string
          sub_label?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      support_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number
          id: string
          published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["support_sender_role"]
          thread_id?: string
        }
        Relationships: []
      }
      support_threads: {
        Row: {
          agent_id: string | null
          agent_initials: string
          agent_name: string
          agent_role: string
          created_at: string
          id: string
          last_message_at: string
          status: Database["public"]["Enums"]["support_thread_status"]
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_initials?: string
          agent_name?: string
          agent_role?: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_thread_status"]
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          agent_initials?: string
          agent_name?: string
          agent_role?: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: Database["public"]["Enums"]["support_thread_status"]
          subject?: string | null
          updated_at?: string
          user_id?: string
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
      user_preferences: {
        Row: {
          accent: string
          allow_research_use: boolean
          badge_unlock_email: boolean
          daily_advice_email: boolean
          daily_water_liters: number
          dark_mode: boolean
          density: string
          email_notifications: boolean
          font_size: number
          language: string
          push_notifications: boolean
          reminder_time: string
          share_progress_with_coach: boolean
          show_in_vip_list: boolean
          target_blood_sugar_max: number
          target_blood_sugar_min: number
          target_weight_kg: number | null
          updated_at: string
          user_id: string
          weekly_summary_email: boolean
          weight_unit: string
        }
        Insert: {
          accent?: string
          allow_research_use?: boolean
          badge_unlock_email?: boolean
          daily_advice_email?: boolean
          daily_water_liters?: number
          dark_mode?: boolean
          density?: string
          email_notifications?: boolean
          font_size?: number
          language?: string
          push_notifications?: boolean
          reminder_time?: string
          share_progress_with_coach?: boolean
          show_in_vip_list?: boolean
          target_blood_sugar_max?: number
          target_blood_sugar_min?: number
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
          weekly_summary_email?: boolean
          weight_unit?: string
        }
        Update: {
          accent?: string
          allow_research_use?: boolean
          badge_unlock_email?: boolean
          daily_advice_email?: boolean
          daily_water_liters?: number
          dark_mode?: boolean
          density?: string
          email_notifications?: boolean
          font_size?: number
          language?: string
          push_notifications?: boolean
          reminder_time?: string
          share_progress_with_coach?: boolean
          show_in_vip_list?: boolean
          target_blood_sugar_max?: number
          target_blood_sugar_min?: number
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
          weekly_summary_email?: boolean
          weight_unit?: string
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
      insert_support_auto_reply: {
        Args: { p_thread_id: string; p_body: string }
        Returns: Database["public"]["Tables"]["support_messages"]["Row"]
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
      consultation_status: "scheduled" | "completed" | "cancelled" | "no_show"
      consultation_type: "video" | "in_person" | "audio" | "written"
      notification_target: "all" | "plan" | "user"
      plan_type: "basic" | "premium" | "vip"
      resource_type: "pdf" | "video" | "audio"
      subscription_status: "active" | "cancelled" | "expired"
      support_contact_kind: "whatsapp" | "email" | "phone" | "instagram" | "facebook"
      support_sender_role: "user" | "agent" | "system"
      support_thread_status: "open" | "resolved" | "archived"
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
