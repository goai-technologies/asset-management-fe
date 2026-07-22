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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_code: string
          asset_name: string
          assigned_employee_id: string | null
          brand: string | null
          category_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          invoice_number: string | null
          is_deleted: boolean
          location: string | null
          model: string | null
          purchase_cost: number | null
          purchase_cost_inr: number | null
          purchase_date: string | null
          remarks: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          vendor_id: string | null
          warranty_expiry: string | null
          warranty_start: string | null
        }
        Insert: {
          asset_code?: string
          asset_name: string
          assigned_employee_id?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          is_deleted?: boolean
          location?: string | null
          model?: string | null
          purchase_cost?: number | null
          purchase_cost_inr?: number | null
          purchase_date?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          vendor_id?: string | null
          warranty_expiry?: string | null
          warranty_start?: string | null
        }
        Update: {
          asset_code?: string
          asset_name?: string
          assigned_employee_id?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          is_deleted?: boolean
          location?: string | null
          model?: string | null
          purchase_cost?: number | null
          purchase_cost_inr?: number | null
          purchase_date?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          vendor_id?: string | null
          warranty_expiry?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          asset_id: string
          assigned_date: string
          created_at: string
          employee_id: string | null
          expected_return_date: string | null
          id: string
          notes: string | null
          performed_by: string | null
          reason: string | null
          returned_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          asset_id: string
          assigned_date?: string
          created_at?: string
          employee_id?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          reason?: string | null
          returned_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assigned_date?: string
          created_at?: string
          employee_id?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          reason?: string | null
          returned_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          designation: string | null
          email: string
          employee_code: string
          id: string
          location: string | null
          manager: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          employee_code: string
          id?: string
          location?: string | null
          manager?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          employee_code?: string
          id?: string
          location?: string | null
          manager?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      repairs: {
        Row: {
          actual_return_date: string | null
          asset_id: string
          completed_at: string | null
          completed_date: string | null
          created_at: string
          expected_return_date: string | null
          id: string
          issue: string
          notes: string | null
          repair_cost: number | null
          repair_date: string
          repair_notes: string | null
          status: Database["public"]["Enums"]["repair_status"]
          unassign_reason: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          issue: string
          notes?: string | null
          repair_cost?: number | null
          repair_date?: string
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          issue?: string
          notes?: string | null
          repair_cost?: number | null
          repair_date?: string
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repairs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          notes: string | null
          office_address: string | null
          phone: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          vendor_code: string
          vendor_name: string
          vendor_type: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          notes?: string | null
          office_address?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          vendor_code?: string
          vendor_name: string
          vendor_type?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          notes?: string | null
          office_address?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          vendor_code?: string
          vendor_name?: string
          vendor_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_assets_by_category: {
        Row: {
          asset_count: number | null
          category_name: string | null
        }
        Relationships: []
      }
      dashboard_assets_by_status: {
        Row: {
          asset_count: number | null
          status: string | null
        }
        Relationships: []
      }
      dashboard_open_repairs: {
        Row: {
          asset_code: string | null
          asset_id: string | null
          asset_name: string | null
          expected_return_date: string | null
          repair_cost: number | null
          repair_date: string | null
          repair_id: string | null
          repair_status: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      dashboard_recent_activity: {
        Row: {
          asset_code: string | null
          asset_name: string | null
          assigned_date: string | null
          assignment_status: string | null
          created_at: string | null
          employee_name: string | null
          id: string | null
          notes: string | null
          performed_by: string | null
          reason: string | null
          returned_date: string | null
        }
        Relationships: []
      }
      dashboard_summary: {
        Row: {
          assigned_assets: number | null
          available_assets: number | null
          open_repair_tickets: number | null
          retired_assets: number | null
          total_assets: number | null
          total_employees: number | null
          under_repair_assets: number | null
        }
        Relationships: []
      }
      dashboard_warranty_expiring: {
        Row: {
          asset_code: string | null
          asset_id: string | null
          asset_name: string | null
          days_until_expiry: number | null
          warranty_expiry: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_it: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "administrator" | "it_team" | "employee"
      asset_status:
        | "available"
        | "assigned"
        | "reserved"
        | "repair"
        | "lost"
        | "disposed"
        | "retired"
        | "inactive"
      assignment_status:
        | "active"
        | "returned"
        | "overdue"
        | "assigned"
        | "unassigned"
        | "disposed"
        | "inactive"
      entity_status: "active" | "inactive"
      notification_type:
        | "asset"
        | "assignment"
        | "repair"
        | "warranty"
        | "employee"
        | "system"
      repair_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      app_role: ["administrator", "it_team", "employee"],
      asset_status: [
        "available",
        "assigned",
        "reserved",
        "repair",
        "lost",
        "disposed",
        "retired",
        "inactive",
      ],
      assignment_status: [
        "active",
        "returned",
        "overdue",
        "assigned",
        "unassigned",
        "disposed",
        "inactive",
      ],
      entity_status: ["active", "inactive"],
      notification_type: [
        "asset",
        "assignment",
        "repair",
        "warranty",
        "employee",
        "system",
      ],
      repair_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
