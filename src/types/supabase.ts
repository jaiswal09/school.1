export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          acquisition_date: string | null
          category_id: string
          cost: number | null
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          last_maintained: string | null
          location: string
          min_quantity: number
          name: string
          qr_code: string | null
          quantity: number
          status: string
          supplier: string | null
          type: string
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          category_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          last_maintained?: string | null
          location: string
          min_quantity: number
          name: string
          qr_code?: string | null
          quantity: number
          status: string
          supplier?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          category_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          last_maintained?: string | null
          location?: string
          min_quantity?: number
          name?: string
          qr_code?: string | null
          quantity?: number
          status?: string
          supplier?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          id: string
          item_id: string
          maintenance_date: string
          next_maintenance_date: string | null
          performed_by: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          item_id: string
          maintenance_date: string
          next_maintenance_date?: string | null
          performed_by: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          item_id?: string
          maintenance_date?: string
          next_maintenance_date?: string | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      reservations: {
        Row: {
          created_at: string
          end_time: string
          id: string
          purpose: string | null
          resource_id: string
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          purpose?: string | null
          resource_id: string
          start_time: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          purpose?: string | null
          resource_id?: string
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_resource_id_fkey"
            columns: ["resource_id"]
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          actual_return_date: string | null
          checkout_date: string
          created_at: string
          expected_return_date: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_return_date?: string | null
          checkout_date: string
          created_at?: string
          expected_return_date?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_return_date?: string | null
          checkout_date?: string
          created_at?: string
          expected_return_date?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}