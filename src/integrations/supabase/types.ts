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
      detalle_entradas: {
        Row: {
          cantidad: number
          codigo_barra_ingresado: string | null
          costo_total: number
          costo_unitario: number
          entrada_id: string
          id: string
          producto_id: string
        }
        Insert: {
          cantidad: number
          codigo_barra_ingresado?: string | null
          costo_total: number
          costo_unitario: number
          entrada_id: string
          id?: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          codigo_barra_ingresado?: string | null
          costo_total?: number
          costo_unitario?: number
          entrada_id?: string
          id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_entradas_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_entradas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_recetas: {
        Row: {
          cantidad_insumo_por_unidad: number
          id: string
          insumo_id: string
          receta_id: string
        }
        Insert: {
          cantidad_insumo_por_unidad: number
          id?: string
          insumo_id: string
          receta_id: string
        }
        Update: {
          cantidad_insumo_por_unidad?: number
          id?: string
          insumo_id?: string
          receta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_recetas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_recetas_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_inventario: {
        Row: {
          created_at: string
          fecha_compra: string
          id: string
          notas: string | null
          numero_factura_proveedor: string | null
          proveedor_id: string
          user_id: string
          valor_total_factura: number | null
        }
        Insert: {
          created_at?: string
          fecha_compra?: string
          id?: string
          notas?: string | null
          numero_factura_proveedor?: string | null
          proveedor_id: string
          user_id: string
          valor_total_factura?: number | null
        }
        Update: {
          created_at?: string
          fecha_compra?: string
          id?: string
          notas?: string | null
          numero_factura_proveedor?: string | null
          proveedor_id?: string
          user_id?: string
          valor_total_factura?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entradas_inventario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          costo_unitario_referencia: number | null
          created_at: string
          fecha: string
          id: string
          notas: string | null
          producto_id: string
          referencia: string | null
          stock_resultante: number
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario_referencia?: number | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          producto_id: string
          referencia?: string | null
          stock_resultante: number
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
          user_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario_referencia?: number | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          producto_id?: string
          referencia?: string | null
          stock_resultante?: number
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string | null
          codigo_barra: string | null
          codigo_interno: string | null
          costo_promedio: number
          created_at: string
          es_activo: boolean
          id: string
          nombre: string
          stock_actual: number
          stock_minimo: number
          tipo_producto: Database["public"]["Enums"]["tipo_producto"]
          unidad_inventario: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          codigo_barra?: string | null
          codigo_interno?: string | null
          costo_promedio?: number
          created_at?: string
          es_activo?: boolean
          id?: string
          nombre: string
          stock_actual?: number
          stock_minimo?: number
          tipo_producto?: Database["public"]["Enums"]["tipo_producto"]
          unidad_inventario?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          codigo_barra?: string | null
          codigo_interno?: string | null
          costo_promedio?: number
          created_at?: string
          es_activo?: boolean
          id?: string
          nombre?: string
          stock_actual?: number
          stock_minimo?: number
          tipo_producto?: Database["public"]["Enums"]["tipo_producto"]
          unidad_inventario?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          contacto: string | null
          created_at: string
          documento: string | null
          id: string
          nombre: string
          observaciones: string | null
          user_id: string
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          user_id: string
        }
        Update: {
          contacto?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recetas: {
        Row: {
          created_at: string
          id: string
          producto_final_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          producto_final_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          producto_final_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_producto_final_id_fkey"
            columns: ["producto_final_id"]
            isOneToOne: true
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_movimiento: "entrada" | "salida_venta" | "ajuste" | "consumo"
      tipo_producto: "retail" | "preparado"
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
      tipo_movimiento: ["entrada", "salida_venta", "ajuste", "consumo"],
      tipo_producto: ["retail", "preparado"],
    },
  },
} as const
