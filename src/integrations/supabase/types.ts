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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          summary: string | null
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          summary?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          summary?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      datos_fiscales: {
        Row: {
          ciudad: string | null
          consecutivo_actual: number | null
          created_at: string
          direccion: string | null
          email: string | null
          fecha_resolucion: string | null
          id: string
          leyenda_legal: string | null
          logo_url: string | null
          nit: string | null
          nombre_comercial: string
          numero_resolucion_dian: string | null
          politica_cambios: string | null
          prefijo_factura: string | null
          rango_autorizado_desde: number | null
          rango_autorizado_hasta: number | null
          razon_social: string | null
          regimen_tributario: string | null
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ciudad?: string | null
          consecutivo_actual?: number | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_resolucion?: string | null
          id?: string
          leyenda_legal?: string | null
          logo_url?: string | null
          nit?: string | null
          nombre_comercial?: string
          numero_resolucion_dian?: string | null
          politica_cambios?: string | null
          prefijo_factura?: string | null
          rango_autorizado_desde?: number | null
          rango_autorizado_hasta?: number | null
          razon_social?: string | null
          regimen_tributario?: string | null
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ciudad?: string | null
          consecutivo_actual?: number | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_resolucion?: string | null
          id?: string
          leyenda_legal?: string | null
          logo_url?: string | null
          nit?: string | null
          nombre_comercial?: string
          numero_resolucion_dian?: string | null
          politica_cambios?: string | null
          prefijo_factura?: string | null
          rango_autorizado_desde?: number | null
          rango_autorizado_hasta?: number | null
          razon_social?: string | null
          regimen_tributario?: string | null
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      detalle_entradas_menu: {
        Row: {
          cantidad: number
          costo_total: number
          costo_unitario: number
          entrada_id: string
          id: string
          menu_item_id: string
        }
        Insert: {
          cantidad?: number
          costo_total?: number
          costo_unitario?: number
          entrada_id: string
          id?: string
          menu_item_id: string
        }
        Update: {
          cantidad?: number
          costo_total?: number
          costo_unitario?: number
          entrada_id?: string
          id?: string
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_entradas_menu_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas_menu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_entradas_menu_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_facturas_fisicas: {
        Row: {
          cantidad: number
          descripcion: string
          descuento: number
          factura_id: string
          id: string
          iva: number
          precio_unitario: number
          total: number
          unidad: string | null
        }
        Insert: {
          cantidad?: number
          descripcion: string
          descuento?: number
          factura_id: string
          id?: string
          iva?: number
          precio_unitario?: number
          total?: number
          unidad?: string | null
        }
        Update: {
          cantidad?: number
          descripcion?: string
          descuento?: number
          factura_id?: string
          id?: string
          iva?: number
          precio_unitario?: number
          total?: number
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_facturas_fisicas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas_fisicas"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_ordenes_activas: {
        Row: {
          cantidad: number
          id: string
          menu_item_id: string | null
          nombre_item: string
          notas: string | null
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          id?: string
          menu_item_id?: string | null
          nombre_item: string
          notas?: string | null
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          id?: string
          menu_item_id?: string | null
          nombre_item?: string
          notas?: string | null
          orden_id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_ordenes_activas_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ordenes_activas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_activas"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_ordenes_pos: {
        Row: {
          cantidad: number
          id: string
          menu_item_id: string | null
          nombre_item: string
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number
          id?: string
          menu_item_id?: string | null
          nombre_item: string
          orden_id: string
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          id?: string
          menu_item_id?: string | null
          nombre_item?: string
          orden_id?: string
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_ordenes_pos_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ordenes_pos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_pos"
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
      documentos_empleados: {
        Row: {
          archivo_url: string | null
          created_at: string
          empleado_id: string
          id: string
          nombre: string
          notas: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string
          empleado_id: string
          id?: string
          nombre: string
          notas?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          archivo_url?: string | null
          created_at?: string
          empleado_id?: string
          id?: string
          nombre?: string
          notas?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empleados_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      elementos_planta: {
        Row: {
          alto: number | null
          ancho: number | null
          color: string | null
          created_at: string | null
          forma: string | null
          id: string
          nombre: string | null
          pos_x: number | null
          pos_y: number | null
          rotacion: number | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alto?: number | null
          ancho?: number | null
          color?: string | null
          created_at?: string | null
          forma?: string | null
          id?: string
          nombre?: string | null
          pos_x?: number | null
          pos_y?: number | null
          rotacion?: number | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alto?: number | null
          ancho?: number | null
          color?: string | null
          created_at?: string | null
          forma?: string | null
          id?: string
          nombre?: string | null
          pos_x?: number | null
          pos_y?: number | null
          rotacion?: number | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          apellido: string
          arl: string | null
          banco: string | null
          cargo: string | null
          cedula: string | null
          created_at: string
          cuenta_bancaria: string | null
          departamento: string | null
          direccion: string | null
          email: string | null
          emergencia_nombre: string | null
          emergencia_tel: string | null
          eps: string | null
          estado: string | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombre: string
          notas: string | null
          salario_base: number | null
          telefono: string | null
          tipo_contrato: string | null
          tipo_cuenta: string | null
          tipo_pago: string | null
          updated_at: string
          user_id: string
          valor_hora: number | null
        }
        Insert: {
          apellido: string
          arl?: string | null
          banco?: string | null
          cargo?: string | null
          cedula?: string | null
          created_at?: string
          cuenta_bancaria?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          emergencia_nombre?: string | null
          emergencia_tel?: string | null
          eps?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          notas?: string | null
          salario_base?: number | null
          telefono?: string | null
          tipo_contrato?: string | null
          tipo_cuenta?: string | null
          tipo_pago?: string | null
          updated_at?: string
          user_id: string
          valor_hora?: number | null
        }
        Update: {
          apellido?: string
          arl?: string | null
          banco?: string | null
          cargo?: string | null
          cedula?: string | null
          created_at?: string
          cuenta_bancaria?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          emergencia_nombre?: string | null
          emergencia_tel?: string | null
          eps?: string | null
          estado?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          salario_base?: number | null
          telefono?: string | null
          tipo_contrato?: string | null
          tipo_cuenta?: string | null
          tipo_pago?: string | null
          updated_at?: string
          user_id?: string
          valor_hora?: number | null
        }
        Relationships: []
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
      entradas_menu: {
        Row: {
          created_at: string
          fecha: string
          id: string
          notas: string | null
          user_id: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          user_id: string
          valor_total?: number
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      facturas_fisicas: {
        Row: {
          base_gravable: number
          cliente_direccion: string | null
          cliente_documento: string | null
          cliente_nombre: string | null
          created_at: string
          descuento: number
          fecha_expedicion: string
          id: string
          iva_total: number
          medio_pago: string | null
          mesa: string | null
          numero_factura: string
          orden_id: string | null
          otros_impuestos: number
          subtotal: number
          total: number
          total_en_letras: string | null
          user_id: string
          vendedor: string | null
        }
        Insert: {
          base_gravable?: number
          cliente_direccion?: string | null
          cliente_documento?: string | null
          cliente_nombre?: string | null
          created_at?: string
          descuento?: number
          fecha_expedicion?: string
          id?: string
          iva_total?: number
          medio_pago?: string | null
          mesa?: string | null
          numero_factura: string
          orden_id?: string | null
          otros_impuestos?: number
          subtotal?: number
          total?: number
          total_en_letras?: string | null
          user_id: string
          vendedor?: string | null
        }
        Update: {
          base_gravable?: number
          cliente_direccion?: string | null
          cliente_documento?: string | null
          cliente_nombre?: string | null
          created_at?: string
          descuento?: number
          fecha_expedicion?: string
          id?: string
          iva_total?: number
          medio_pago?: string | null
          mesa?: string | null
          numero_factura?: string
          orden_id?: string | null
          otros_impuestos?: number
          subtotal?: number
          total?: number
          total_en_letras?: string | null
          user_id?: string
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_fisicas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_operativos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          monto: number
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          categoria: string | null
          costo_promedio: number
          costo_unitario: number
          created_at: string
          descripcion: string | null
          es_activo: boolean
          id: string
          image_url: string | null
          nombre: string
          orden_display: number | null
          precio: number
          stock_actual: number
          tipo_item: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          costo_promedio?: number
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          es_activo?: boolean
          id?: string
          image_url?: string | null
          nombre: string
          orden_display?: number | null
          precio?: number
          stock_actual?: number
          tipo_item?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          costo_promedio?: number
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          es_activo?: boolean
          id?: string
          image_url?: string | null
          nombre?: string
          orden_display?: number | null
          precio?: number
          stock_actual?: number
          tipo_item?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mesas: {
        Row: {
          alto: number | null
          ancho: number | null
          capacidad: number | null
          created_at: string
          es_activa: boolean | null
          forma: string | null
          id: string
          nombre: string | null
          numero_mesa: number
          pos_x: number | null
          pos_y: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alto?: number | null
          ancho?: number | null
          capacidad?: number | null
          created_at?: string
          es_activa?: boolean | null
          forma?: string | null
          id?: string
          nombre?: string | null
          numero_mesa: number
          pos_x?: number | null
          pos_y?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alto?: number | null
          ancho?: number | null
          capacidad?: number | null
          created_at?: string
          es_activa?: boolean | null
          forma?: string | null
          id?: string
          nombre?: string | null
          numero_mesa?: number
          pos_x?: number | null
          pos_y?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      nominas: {
        Row: {
          created_at: string
          deducciones: number | null
          empleado_id: string
          estado: string | null
          horas_trabajadas: number | null
          id: string
          notas: string | null
          periodo_fin: string
          periodo_inicio: string
          salario_base: number | null
          total_devengado: number | null
          total_pagar: number | null
          updated_at: string
          user_id: string
          valor_hora: number | null
        }
        Insert: {
          created_at?: string
          deducciones?: number | null
          empleado_id: string
          estado?: string | null
          horas_trabajadas?: number | null
          id?: string
          notas?: string | null
          periodo_fin: string
          periodo_inicio: string
          salario_base?: number | null
          total_devengado?: number | null
          total_pagar?: number | null
          updated_at?: string
          user_id: string
          valor_hora?: number | null
        }
        Update: {
          created_at?: string
          deducciones?: number | null
          empleado_id?: string
          estado?: string | null
          horas_trabajadas?: number | null
          id?: string
          notas?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          salario_base?: number | null
          total_devengado?: number | null
          total_pagar?: number | null
          updated_at?: string
          user_id?: string
          valor_hora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nominas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_activas: {
        Row: {
          created_at: string
          estado: string | null
          id: string
          mesa_id: string | null
          nombre_cliente: string | null
          numero_orden: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string | null
          id?: string
          mesa_id?: string | null
          nombre_cliente?: string | null
          numero_orden: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string | null
          id?: string
          mesa_id?: string | null
          nombre_cliente?: string | null
          numero_orden?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_activas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_eliminadas_pos: {
        Row: {
          comentario: string | null
          fecha_eliminacion: string
          fecha_orden: string
          id: string
          motivo_eliminacion: string | null
          numero_orden: number
          orden_original_id: string | null
          total: number
          user_id: string
        }
        Insert: {
          comentario?: string | null
          fecha_eliminacion?: string
          fecha_orden: string
          id?: string
          motivo_eliminacion?: string | null
          numero_orden: number
          orden_original_id?: string | null
          total?: number
          user_id: string
        }
        Update: {
          comentario?: string | null
          fecha_eliminacion?: string
          fecha_orden?: string
          id?: string
          motivo_eliminacion?: string | null
          numero_orden?: number
          orden_original_id?: string | null
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      ordenes_pos: {
        Row: {
          comentario: string | null
          created_at: string
          fecha: string
          id: string
          numero_orden: number
          total: number
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          fecha?: string
          id?: string
          numero_orden: number
          total?: number
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          fecha?: string
          id?: string
          numero_orden?: number
          total?: number
          user_id?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
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
          menu_item_id: string | null
          producto_final_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          producto_final_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          producto_final_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_producto_final_id_fkey"
            columns: ["producto_final_id"]
            isOneToOne: true
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_asistencia: {
        Row: {
          created_at: string
          empleado_id: string
          id: string
          notas: string | null
          timestamp: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          id?: string
          notas?: string | null
          timestamp?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          id?: string
          notas?: string | null
          timestamp?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_asistencia_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_caja: {
        Row: {
          abierta_por: string | null
          cerrada_por: string | null
          created_at: string
          diferencia: number | null
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          monto_apertura: number
          monto_cierre: number | null
          notas_apertura: string | null
          notas_cierre: string | null
          total_efectivo: number | null
          total_otros: number | null
          total_tarjeta: number | null
          total_ventas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abierta_por?: string | null
          cerrada_por?: string | null
          created_at?: string
          diferencia?: number | null
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          notas_apertura?: string | null
          notas_cierre?: string | null
          total_efectivo?: number | null
          total_otros?: number | null
          total_tarjeta?: number | null
          total_ventas?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abierta_por?: string | null
          cerrada_por?: string | null
          created_at?: string
          diferencia?: number | null
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_apertura?: number
          monto_cierre?: number | null
          notas_apertura?: string | null
          notas_cierre?: string | null
          total_efectivo?: number | null
          total_otros?: number | null
          total_tarjeta?: number | null
          total_ventas?: number | null
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          pin_seguridad: string | null
          store_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_seguridad?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_seguridad?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
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
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
      tipo_movimiento: "entrada" | "salida_venta" | "ajuste" | "consumo"
      tipo_producto: "retail" | "preparado" | "insumo"
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
      app_role: ["admin", "user", "owner"],
      tipo_movimiento: ["entrada", "salida_venta", "ajuste", "consumo"],
      tipo_producto: ["retail", "preparado", "insumo"],
    },
  },
} as const
