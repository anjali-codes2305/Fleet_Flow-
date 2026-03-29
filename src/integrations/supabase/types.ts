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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          complaints: number
          created_at: string
          id: string
          license_category: string
          license_expiry: string
          license_number: string
          name: string
          phone: string
          safety_score: number
          status: Database["public"]["Enums"]["driver_status"]
          total_km: number
          total_trips: number
          updated_at: string
        }
        Insert: {
          complaints?: number
          created_at?: string
          id?: string
          license_category?: string
          license_expiry: string
          license_number: string
          name: string
          phone?: string
          safety_score?: number
          status?: Database["public"]["Enums"]["driver_status"]
          total_km?: number
          total_trips?: number
          updated_at?: string
        }
        Update: {
          complaints?: number
          created_at?: string
          id?: string
          license_category?: string
          license_expiry?: string
          license_number?: string
          name?: string
          phone?: string
          safety_score?: number
          status?: Database["public"]["Enums"]["driver_status"]
          total_km?: number
          total_trips?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string
          id: string
          vehicle_id: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          date: string
          id: string
          liters: number
          odometer: number
          station: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          liters?: number
          odometer?: number
          station?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          liters?: number
          odometer?: number
          station?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_events: {
        Row: {
          created_at: string
          event_type: string
          geofence_id: string
          id: string
          latitude: number
          longitude: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          geofence_id: string
          id?: string
          latitude: number
          longitude: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          geofence_id?: string
          id?: string
          latitude?: number
          longitude?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          alert_on_enter: boolean
          alert_on_exit: boolean
          center_lat: number
          center_lng: number
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          radius_km: number
          updated_at: string
        }
        Insert: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat: number
          center_lng: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          radius_km?: number
          updated_at?: string
        }
        Update: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat?: number
          center_lng?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          radius_km?: number
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          cost: number
          created_at: string
          date: string
          description: string
          id: string
          status: Database["public"]["Enums"]["maintenance_status"]
          technician: string
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          technician?: string
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          technician?: string
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          cargo_description: string
          cargo_weight: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          destination: string
          dispatched_at: string | null
          distance: number
          driver_id: string
          estimated_duration: string
          id: string
          origin: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cargo_description?: string
          cargo_weight?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          destination: string
          dispatched_at?: string | null
          distance?: number
          driver_id: string
          estimated_duration?: string
          id?: string
          origin: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cargo_description?: string
          cargo_weight?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          dispatched_at?: string | null
          distance?: number
          driver_id?: string
          estimated_duration?: string
          id?: string
          origin?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_locations: {
        Row: {
          heading: number
          id: string
          latitude: number
          longitude: number
          speed: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          heading?: number
          id?: string
          latitude: number
          longitude: number
          speed?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          heading?: number
          id?: string
          latitude?: number
          longitude?: number
          speed?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_cost: number
          created_at: string
          fuel_type: string
          id: string
          license_plate: string
          max_capacity: number
          model: string
          name: string
          odometer: number
          region: string
          status: Database["public"]["Enums"]["vehicle_status"]
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
          year: number
        }
        Insert: {
          acquisition_cost?: number
          created_at?: string
          fuel_type?: string
          id?: string
          license_plate: string
          max_capacity?: number
          model: string
          name: string
          odometer?: number
          region?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          year?: number
        }
        Update: {
          acquisition_cost?: number
          created_at?: string
          fuel_type?: string
          id?: string
          license_plate?: string
          max_capacity?: number
          model?: string
          name?: string
          odometer?: number
          region?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "manager"
        | "dispatcher"
        | "safety_officer"
        | "financial_analyst"
      driver_status: "On Duty" | "Off Duty" | "On Trip" | "Suspended"
      expense_category: "Fuel" | "Maintenance" | "Insurance" | "Toll" | "Other"
      maintenance_status: "Scheduled" | "In Progress" | "Completed"
      maintenance_type:
        | "Preventive"
        | "Repair"
        | "Inspection"
        | "Tire Service"
        | "Engine"
      trip_status: "Draft" | "Dispatched" | "Completed" | "Cancelled"
      vehicle_status: "Available" | "On Trip" | "In Shop" | "Out of Service"
      vehicle_type: "Truck" | "Van" | "Trailer" | "Tanker"
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
      app_role: [
        "manager",
        "dispatcher",
        "safety_officer",
        "financial_analyst",
      ],
      driver_status: ["On Duty", "Off Duty", "On Trip", "Suspended"],
      expense_category: ["Fuel", "Maintenance", "Insurance", "Toll", "Other"],
      maintenance_status: ["Scheduled", "In Progress", "Completed"],
      maintenance_type: [
        "Preventive",
        "Repair",
        "Inspection",
        "Tire Service",
        "Engine",
      ],
      trip_status: ["Draft", "Dispatched", "Completed", "Cancelled"],
      vehicle_status: ["Available", "On Trip", "In Shop", "Out of Service"],
      vehicle_type: ["Truck", "Van", "Trailer", "Tanker"],
    },
  },
} as const
