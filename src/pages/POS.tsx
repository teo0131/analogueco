import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemButton } from "@/components/MenuItemButton";
import { CurrentOrder } from "@/components/CurrentOrder";
import { OrderHistory, CompletedOrder } from "@/components/OrderHistory";
import { DeletedOrders } from "@/components/DeletedOrders";
import { OrderDetail } from "@/components/OrderDetail";
import { GenerarFactura } from "@/components/factura/GenerarFactura";
import { ActiveOrdersPanel } from "@/components/ActiveOrdersPanel";
import { ActiveOrdersHistory } from "@/components/ActiveOrdersHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Menu, Store, Calculator, X, Users, Check, ClipboardList, ShoppingBag, MapPin, Banknote, DollarSign, Unlock, CreditCard, UserCheck } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface MenuItemDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  es_activo: boolean;
  tipo_item: string;
  stock_actual: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url?: string;
  tipo_item: string;
  stock_actual: number;
}

interface OrdenActiva {
  id: string;
  numero_orden: number;
  nombre_cliente: string | null;
  total: number;
  estado: string;
  created_at: string;
  mesa_id: string | null;
  mesa?: { id: string; numero_mesa: number; nombre: string | null };
  detalles: Array<{
    id: string;
    nombre_item: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    notas: string | null;
    menu_item_id: string | null;
  }>;
}

const POS = () => {
  const scrollPositionRef = useRef(0);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  // Memoize items per category so grid positions never change after initial load
  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const cat of categories) {
      map[cat] = menuItems.filter(item => item.category === cat);
    }
    return map;
  }, [menuItems, categories]);
  const [currentItems, setCurrentItems] = useState<MenuItem[]>([]);
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState(1);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  // Active orders state
  const [selectedActiveOrder, setSelectedActiveOrder] = useState<OrdenActiva | null>(null);
  const [activeOrdersKey, setActiveOrdersKey] = useState(0);
  const [closingActiveOrder, setClosingActiveOrder] = useState(false);
  const [isSendingToActive, setIsSendingToActive] = useState(false);

  const setDetailOpen = (open: boolean) => {
    if (open) {
      scrollPositionRef.current = window.scrollY;
    }
    setIsDetailOpen(open);
    if (!open) {
      requestAnimationFrame(() => window.scrollTo(0, scrollPositionRef.current));
    }
  };
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [storeNameInput, setStoreNameInput] = useState("");
  const [savingStoreName, setSavingStoreName] = useState(false);

  // Change calculator state
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState<number | null>(null);

  // Invoice state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<CompletedOrder | null>(null);

  // Complete order options dialog
  const [showCompleteOptions, setShowCompleteOptions] = useState(false);
  const [pendingOrderItems, setPendingOrderItems] = useState<MenuItem[]>([]);
  const [pendingOrderComment, setPendingOrderComment] = useState("");
  const [sendToActiveMesa, setSendToActiveMesa] = useState("");
  const [sendToActiveCliente, setSendToActiveCliente] = useState("");
  const [availableMesas, setAvailableMesas] = useState<Array<{ id: string; numero_mesa: number; nombre: string | null }>>([]);

  // ── Cargar a cuenta de deuda ─────────────────────────────────────
  const [showDeudaSelector, setShowDeudaSelector] = useState(false);
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string; saldo_total: number; telefono: string | null; tipo_cuenta: string }>>([]);
  const [selectedClienteDeuda, setSelectedClienteDeuda] = useState<string>("");
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [cargandoDeuda, setCargandoDeuda] = useState(false);

  // ── Caja ──────────────────────────────────────────────────────────
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null); // null = cargando
  const [sesionCajaId, setSesionCajaId] = useState<string | null>(null);
  const [showAbrirCajaDialog, setShowAbrirCajaDialog] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [notasApertura, setNotasApertura] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  // pendingAction: qué se ejecuta DESPUÉS de que el usuario abra la caja
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Load menu items and orders from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load user settings (store name)
        const { data: settingsData } = await supabase
          .from("user_settings")
          .select("store_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsData?.store_name) {
          setStoreName(settingsData.store_name);
        }

        // Load menu items
        const { data: menuData, error: menuError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("es_activo", true)
          .order("categoria")
          .order("orden_display");

        if (menuError) throw menuError;

        if (menuData && menuData.length > 0) {
          const items: MenuItem[] = menuData.map((item: MenuItemDB) => ({
            id: item.id,
            name: item.nombre,
            price: item.precio,
            description: item.descripcion || "",
            category: item.categoria || "Sin Categoría",
            image_url: (item as any).image_url || undefined,
            tipo_item: item.tipo_item || "retail",
            stock_actual: item.stock_actual || 0,
          }));
          const sortedItems = [...items].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
          );
          setMenuItems(sortedItems);
          setCategories(Array.from(new Set(sortedItems.map(item => item.category))).sort((a, b) =>
            a.localeCompare(b, 'es', { sensitivity: 'base' })
          ));
        }

        // Load completed orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("ordenes_pos")
          .select(`
            *,
            detalle_ordenes_pos (*)
          `)
          .eq("user_id", user.id)
          .order("fecha", { ascending: false });

        if (ordersError) throw ordersError;

        if (ordersData) {
          const orders: CompletedOrder[] = ordersData.map((order: any) => ({
            id: order.id,
            orderNumber: order.numero_orden,
            items: order.detalle_ordenes_pos.map((d: any) => ({
              name: d.nombre_item,
              price: d.precio_unitario,
            })),
            total: order.total,
            comment: order.comentario || "",
            timestamp: new Date(order.fecha),
          }));
          setCompletedOrders(orders);
          
          // Set next order number
          const maxOrder = Math.max(0, ...ordersData.map((o: any) => o.numero_orden));
          setOrderNumber(maxOrder + 1);
        }

        // Load deleted orders
        const { data: deletedData, error: deletedError } = await supabase
          .from("ordenes_eliminadas_pos")
          .select("*")
          .eq("user_id", user.id)
          .order("fecha_eliminacion", { ascending: false });

        if (deletedError) throw deletedError;

        if (deletedData) {
          const deleted: CompletedOrder[] = deletedData.map((order: any) => ({
            id: order.id,
            orderNumber: order.numero_orden,
            items: [],
            total: order.total,
            comment: order.comentario || "",
            timestamp: new Date(order.fecha_orden),
          }));
          setDeletedOrders(deleted);
        }

        // Load available mesas for sending to active orders
        const { data: mesasData } = await supabase
          .from("mesas")
          .select("id, numero_mesa, nombre")
          .eq("user_id", user.id)
          .eq("es_activa", true)
          .order("numero_mesa");

        if (mesasData) {
          setAvailableMesas(mesasData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Verificar estado de caja al cargar
  useEffect(() => {
    const checkCaja = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("sesiones_caja")
        .select("id")
        .eq("user_id", user.id)
        .eq("estado", "abierta")
        .limit(1)
        .maybeSingle();
      setCajaAbierta(!!data);
      setSesionCajaId(data?.id ?? null);
    };
    checkCaja();
  }, []);

  // Abrir caja desde el POS
  const handleAbrirCajaPOS = async () => {
    setAbriendo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await (supabase as any)
        .from("sesiones_caja")
        .insert({
          user_id: user.id,
          estado: "abierta",
          monto_apertura: parseFloat(montoApertura) || 0,
          notas_apertura: notasApertura || null,
          abierta_por: user.email?.split("@")[0] || "operador",
        })
        .select("id")
        .single();
      if (error) throw error;
      setCajaAbierta(true);
      setSesionCajaId(data.id);
      toast.success("✅ Caja abierta — continuando con la orden");
      setShowAbrirCajaDialog(false);
      setMontoApertura("");
      setNotasApertura("");
      // Ejecutar la acción pendiente (completar orden)
      if (pendingActionRef.current) {
        pendingActionRef.current();
        pendingActionRef.current = null;
      }
    } catch {
      toast.error("Error al abrir caja");
    } finally {
      setAbriendo(false);
    }
  };

  // Guard: verifica caja antes de ejecutar acción
  const withCajaGuard = useCallback((action: () => void) => {
    if (cajaAbierta) {
      action();
    } else {
      pendingActionRef.current = action;
      setShowAbrirCajaDialog(true);
    }
  }, [cajaAbierta]);



  const currentTotal = currentItems.reduce((sum, item) => sum + item.price, 0);

  const handleAddItem = async (item: MenuItem) => {
    // If there's a selected active order, add item to it
    if (selectedActiveOrder) {
      try {
        const subtotal = item.price;
        const { error } = await supabase.from("detalle_ordenes_activas").insert({
          orden_id: selectedActiveOrder.id,
          menu_item_id: item.id,
          nombre_item: item.name,
          cantidad: 1,
          precio_unitario: item.price,
          subtotal
        });

        if (error) throw error;

        // Update order total
        const newTotal = selectedActiveOrder.total + subtotal;
        await supabase.from("ordenes_activas").update({ total: newTotal }).eq("id", selectedActiveOrder.id);

        // Update local state
        setSelectedActiveOrder({
          ...selectedActiveOrder,
          total: newTotal,
          detalles: [...selectedActiveOrder.detalles, {
            id: crypto.randomUUID(),
            nombre_item: item.name,
            cantidad: 1,
            precio_unitario: item.price,
            subtotal,
            notas: null,
            menu_item_id: item.id
          }]
        });

        toast.success(`${item.name} agregado a orden #${selectedActiveOrder.numero_orden}`);
        setActiveOrdersKey(prev => prev + 1);
      } catch (error) {
        console.error("Error adding item to active order:", error);
        toast.error("Error al agregar item");
      }
    } else {
      // Normal flow - add to current items
      setCurrentItems([...currentItems, item]);
      toast.success(`${item.name} añadido a la orden`);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...currentItems];
    const removedItem = newItems.splice(index, 1)[0];
    setCurrentItems(newItems);
    toast.info(`${removedItem.name} removido de la orden`);
  };

  // Close active order - complete it and move to history
  const handleCloseActiveOrder = async () => {
    if (!selectedActiveOrder || selectedActiveOrder.detalles.length === 0) {
      toast.error("La orden no tiene items");
      return;
    }

    setClosingActiveOrder(true);
    const stockWarnings: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Process inventory for each item
      for (const detalle of selectedActiveOrder.detalles) {
        if (!detalle.menu_item_id) continue;

        const { data: menuItem } = await supabase
          .from("menu_items")
          .select("tipo_item, stock_actual")
          .eq("id", detalle.menu_item_id)
          .single();

        if (!menuItem) continue;

        if (menuItem.tipo_item === 'retail') {
          if (menuItem.stock_actual <= 0) {
            stockWarnings.push(`⚠️ ${detalle.nombre_item}: SIN STOCK`);
          } else if (menuItem.stock_actual < 3) {
            stockWarnings.push(`⚡ ${detalle.nombre_item}: Stock muy bajo`);
          }

          const nuevoStock = menuItem.stock_actual - detalle.cantidad;
          await supabase.from("menu_items").update({ stock_actual: nuevoStock }).eq("id", detalle.menu_item_id);
        } else if (menuItem.tipo_item === 'receta') {
          const { data: recetaData } = await supabase
            .from("recetas")
            .select(`id, detalle_recetas (insumo_id, cantidad_insumo_por_unidad, insumo:productos!detalle_recetas_insumo_id_fkey (id, nombre, stock_actual, costo_promedio))`)
            .eq("menu_item_id", detalle.menu_item_id)
            .maybeSingle();

          if (recetaData && recetaData.detalle_recetas) {
            for (const dr of recetaData.detalle_recetas) {
              const insumo = dr.insumo as any;
              const cantidadRequerida = dr.cantidad_insumo_por_unidad * detalle.cantidad;

              if (insumo.stock_actual <= 0) {
                stockWarnings.push(`⚠️ ${insumo.nombre}: SIN STOCK`);
              } else if (insumo.stock_actual < cantidadRequerida) {
                stockWarnings.push(`⚠️ ${insumo.nombre}: Stock insuficiente`);
              }

              const nuevoStock = insumo.stock_actual - cantidadRequerida;
              await supabase.from("productos").update({ stock_actual: nuevoStock }).eq("id", insumo.id);

              await supabase.from("movimientos_inventario").insert({
                producto_id: insumo.id,
                tipo_movimiento: "consumo",
                cantidad: cantidadRequerida,
                stock_resultante: nuevoStock,
                costo_unitario_referencia: insumo.costo_promedio,
                referencia: `Venta POS - Orden Activa #${selectedActiveOrder.numero_orden}`,
                notas: `Consumo para: ${detalle.nombre_item}`,
                user_id: user.id,
              });
            }
          }
        }
      }

      // Create completed order - use original creation date for billing
      const fechaOriginal = new Date(selectedActiveOrder.created_at);
      const { data: newOrder, error: orderError } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: orderNumber,
          total: selectedActiveOrder.total,
          comentario: selectedActiveOrder.nombre_cliente ? `Mesa: ${selectedActiveOrder.mesa?.numero_mesa || 'N/A'} - Cliente: ${selectedActiveOrder.nombre_cliente}` : `Mesa: ${selectedActiveOrder.mesa?.numero_mesa || 'N/A'}`,
          fecha: fechaOriginal.toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Copy details to ordenes_pos
      for (const detalle of selectedActiveOrder.detalles) {
        await supabase.from("detalle_ordenes_pos").insert({
          orden_id: newOrder.id,
          menu_item_id: detalle.menu_item_id,
          nombre_item: detalle.nombre_item,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal
        });
      }

      // Delete active order
      await supabase.from("ordenes_activas").delete().eq("id", selectedActiveOrder.id);

      // Update local state
      const completedOrder: CompletedOrder = {
        id: newOrder.id,
        orderNumber: orderNumber,
        items: selectedActiveOrder.detalles.map(d => ({ name: d.nombre_item, price: d.precio_unitario })),
        total: selectedActiveOrder.total,
        comment: selectedActiveOrder.nombre_cliente || "",
        timestamp: new Date(),
      };

      setCompletedOrders([completedOrder, ...completedOrders]);
      setOrderNumber(orderNumber + 1);
      setSelectedActiveOrder(null);
      setActiveOrdersKey(prev => prev + 1);

      if (stockWarnings.length > 0) {
        toast.warning(`Orden #${selectedActiveOrder.numero_orden} cerrada - ¡ALERTA INVENTARIO!`, {
          description: stockWarnings.slice(0, 3).join('\n'),
          duration: 6000
        });
      } else {
        toast.success(`Orden #${selectedActiveOrder.numero_orden} cerrada y facturada`);
      }
    } catch (error) {
      console.error("Error closing active order:", error);
      toast.error("Error al cerrar orden");
    } finally {
      setClosingActiveOrder(false);
    }
  };

  // Show complete options dialog instead of directly completing
  const handleShowCompleteOptions = () => {
    if (currentItems.length === 0) {
      toast.error("Agrega items a la orden primero");
      return;
    }
    const proceed = () => {
      setPendingOrderItems([...currentItems]);
      setPendingOrderComment(comment);
      setSendToActiveMesa("");
      setSendToActiveCliente("");
      setShowCompleteOptions(true);
    };
    withCajaGuard(proceed);
  };

  // Send current order to active orders (without completing/billing)
  const handleSendToActiveOrders = async () => {
    if (isSendingToActive) return;
    setIsSendingToActive(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Get next active order number
      const { data: lastOrder } = await supabase
        .from("ordenes_activas")
        .select("numero_orden")
        .eq("user_id", user.id)
        .order("numero_orden", { ascending: false })
        .limit(1)
        .single();

      const nextNumber = (lastOrder?.numero_orden || 0) + 1;
      const total = pendingOrderItems.reduce((sum, item) => sum + item.price, 0);

      // Create active order
      const { data: newActiveOrder, error: orderError } = await supabase
        .from("ordenes_activas")
        .insert({
          user_id: user.id,
          numero_orden: nextNumber,
          mesa_id: sendToActiveMesa || null,
          nombre_cliente: sendToActiveCliente || null,
          total: total,
          estado: "abierta"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order details
      const detalles = pendingOrderItems.map(item => ({
        orden_id: newActiveOrder.id,
        menu_item_id: item.id,
        nombre_item: item.name,
        cantidad: 1,
        precio_unitario: item.price,
        subtotal: item.price
      }));

      const { error: detalleError } = await supabase
        .from("detalle_ordenes_activas")
        .insert(detalles);

      if (detalleError) throw detalleError;

      // Clear current order
      setCurrentItems([]);
      setComment("");
      setShowCompleteOptions(false);
      setPendingOrderItems([]);
      setPendingOrderComment("");
      setSendToActiveMesa("");
      setSendToActiveCliente("");
      setActiveOrdersKey(prev => prev + 1);

      toast.success(`Orden enviada a Activas #${nextNumber}`);
    } catch (error) {
      console.error("Error sending to active orders:", error);
      toast.error("Error al enviar a órdenes activas");
    } finally {
      setIsSendingToActive(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (isCompletingOrder) return;

    if (pendingOrderItems.length === 0 && currentItems.length === 0) {
      toast.error("Agrega items a la orden primero");
      return;
    }

    const itemsToProcess = pendingOrderItems.length > 0 ? pendingOrderItems : currentItems;
    const commentToUse = pendingOrderItems.length > 0 ? pendingOrderComment : comment;

    setIsCompletingOrder(true);
    setShowCompleteOptions(false);

    // Collect stock warnings to show after completing the order
    const stockWarnings: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Process inventory deductions based on item type
      for (const item of itemsToProcess) {
        if (item.tipo_item === 'retail') {
          // Para items tipo retail: reducir stock directamente del menu_item
          const { data: menuItemData, error: menuError } = await supabase
            .from("menu_items")
            .select("stock_actual")
            .eq("id", item.id)
            .single();

          if (menuError) {
            toast.error(`Error al verificar stock de ${item.name}`);
            return;
          }

          // Check stock and warn but don't block
          if (menuItemData.stock_actual <= 0) {
            stockWarnings.push(`⚠️ ${item.name}: SIN STOCK (quedará en negativo)`);
          } else if (menuItemData.stock_actual < 3) {
            stockWarnings.push(`⚡ ${item.name}: Stock muy bajo (${menuItemData.stock_actual} restantes)`);
          }

          const nuevoStock = menuItemData.stock_actual - 1;
          const { error: updateError } = await supabase
            .from("menu_items")
            .update({ stock_actual: nuevoStock })
            .eq("id", item.id);

          if (updateError) {
            toast.error(`Error al actualizar stock de ${item.name}`);
            return;
          }
        } else if (item.tipo_item === 'receta') {
          // Para items tipo receta: buscar receta y reducir insumos
          const { data: recetaData } = await supabase
            .from("recetas")
            .select(`
              id,
              detalle_recetas (
                insumo_id,
                cantidad_insumo_por_unidad,
                insumo:productos!detalle_recetas_insumo_id_fkey (
                  id,
                  nombre,
                  stock_actual,
                  costo_promedio,
                  unidad_inventario
                )
              )
            `)
            .eq("menu_item_id", item.id)
            .maybeSingle();

          if (recetaData && recetaData.detalle_recetas) {
            for (const detalle of recetaData.detalle_recetas) {
              const insumo = detalle.insumo as any;
              const cantidadRequerida = detalle.cantidad_insumo_por_unidad;
              
              // Check stock and warn but don't block
              if (insumo.stock_actual <= 0) {
                stockWarnings.push(`⚠️ ${insumo.nombre} (para ${item.name}): SIN STOCK`);
              } else if (insumo.stock_actual < cantidadRequerida) {
                stockWarnings.push(`⚠️ ${insumo.nombre} (para ${item.name}): Stock insuficiente (tiene ${insumo.stock_actual}, necesita ${cantidadRequerida})`);
              } else if (insumo.stock_actual < cantidadRequerida * 3) {
                stockWarnings.push(`⚡ ${insumo.nombre}: Stock bajo (${insumo.stock_actual} restantes)`);
              }

              const nuevoStock = insumo.stock_actual - cantidadRequerida;
              const { error: updateError } = await supabase
                .from("productos")
                .update({ stock_actual: nuevoStock })
                .eq("id", insumo.id);

              if (updateError) {
                toast.error(`Error al actualizar stock de ${insumo.nombre}`);
                return;
              }

              const { error: movimientoError } = await supabase
                .from("movimientos_inventario")
                .insert({
                  producto_id: insumo.id,
                  tipo_movimiento: "consumo",
                  cantidad: cantidadRequerida,
                  stock_resultante: nuevoStock,
                  costo_unitario_referencia: insumo.costo_promedio,
                  referencia: `Venta POS - Orden #${orderNumber}`,
                  notas: `Consumo para preparar: ${item.name}`,
                  user_id: user.id,
                });

              if (movimientoError) {
                toast.error(`Error al registrar movimiento de ${insumo.nombre}`);
                return;
              }
            }
          }
        }
      }

      // Save order to database
      const total = currentItems.reduce((sum, item) => sum + item.price, 0);
      
      const { data: newOrder, error: orderError } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: orderNumber,
          total,
          comentario: comment || null,
          fecha: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Save order details
      const detalles = itemsToProcess.map(item => ({
        orden_id: newOrder.id,
        menu_item_id: item.id,
        nombre_item: item.name,
        precio_unitario: item.price,
        cantidad: 1,
        subtotal: item.price,
      }));

      const { error: detalleError } = await supabase
        .from("detalle_ordenes_pos")
        .insert(detalles);

      if (detalleError) throw detalleError;

      // Update local state
      const completedOrder: CompletedOrder = {
        id: newOrder.id,
        orderNumber,
        items: itemsToProcess.map(item => ({ name: item.name, price: item.price })),
        total,
        comment: commentToUse,
        timestamp: new Date(),
      };

      setCompletedOrders([completedOrder, ...completedOrders]);
      setCurrentItems([]);
      setComment("");
      setPendingOrderItems([]);
      setPendingOrderComment("");
      setOrderNumber(orderNumber + 1);
      setShowChangeCalculator(false);
      setPaymentAmount("");
      setChangeAmount(null);
      
      // Show stock warnings if any (distinct orange/warning style)
      if (stockWarnings.length > 0) {
        // Use a distinct warning toast for stock issues
        toast.warning(
          `Orden #${orderNumber} completada - ¡ALERTA DE INVENTARIO!`,
          {
            description: stockWarnings.slice(0, 5).join('\n') + (stockWarnings.length > 5 ? `\n... y ${stockWarnings.length - 5} más` : ''),
            duration: 8000,
            style: {
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              color: '#92400e',
            },
          }
        );
      } else {
        toast.success(`Orden #${orderNumber} completada con éxito`);
      }
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Error al completar la orden");
    } finally {
      setIsCompletingOrder(false);
    }
  };

  const handleSelectOrder = (order: CompletedOrder) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    const orderIdStr = String(orderId);
    const orderToDelete = completedOrders.find(order => String(order.id) === orderIdStr);
    
    if (!orderToDelete) {
      console.error("Order not found in local state:", orderId);
      toast.error("Orden no encontrada");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Get order details to reverse inventory
      const { data: detalles, error: detallesError } = await supabase
        .from("detalle_ordenes_pos")
        .select("menu_item_id, nombre_item, cantidad")
        .eq("orden_id", orderIdStr);

      if (detallesError) {
        console.error("Error fetching order details:", detallesError);
      }

      // Reverse inventory deductions
      if (detalles && detalles.length > 0) {
        for (const detalle of detalles) {
          if (!detalle.menu_item_id) continue;

          // Get menu item to check type
          const { data: menuItem } = await supabase
            .from("menu_items")
            .select("tipo_item, stock_actual")
            .eq("id", detalle.menu_item_id)
            .maybeSingle();

          if (!menuItem) continue;

          if (menuItem.tipo_item === 'retail') {
            // Reverse retail item: add back stock
            const nuevoStock = menuItem.stock_actual + detalle.cantidad;
            await supabase
              .from("menu_items")
              .update({ stock_actual: nuevoStock })
              .eq("id", detalle.menu_item_id);
          } else if (menuItem.tipo_item === 'receta') {
            // Reverse recipe item: add back ingredients
            const { data: recetaData } = await supabase
              .from("recetas")
              .select(`
                id,
                detalle_recetas (
                  insumo_id,
                  cantidad_insumo_por_unidad,
                  insumo:productos!detalle_recetas_insumo_id_fkey (
                    id,
                    nombre,
                    stock_actual,
                    costo_promedio
                  )
                )
              `)
              .eq("menu_item_id", detalle.menu_item_id)
              .maybeSingle();

            if (recetaData && recetaData.detalle_recetas) {
              for (const detalleReceta of recetaData.detalle_recetas) {
                const insumo = detalleReceta.insumo as any;
                const cantidadARestaurar = detalleReceta.cantidad_insumo_por_unidad * detalle.cantidad;
                const nuevoStock = insumo.stock_actual + cantidadARestaurar;

                await supabase
                  .from("productos")
                  .update({ stock_actual: nuevoStock })
                  .eq("id", insumo.id);

                // Register reverse movement
                await supabase.from("movimientos_inventario").insert({
                  producto_id: insumo.id,
                  tipo_movimiento: "ajuste",
                  cantidad: cantidadARestaurar,
                  stock_resultante: nuevoStock,
                  costo_unitario_referencia: insumo.costo_promedio,
                  referencia: `Reversión Orden #${orderToDelete.orderNumber}`,
                  notas: `Reversión por eliminación de orden - ${detalle.nombre_item}`,
                  user_id: user.id,
                });
              }
            }
          }
        }
      }

      // Save to deleted orders table
      const { error: insertError } = await supabase.from("ordenes_eliminadas_pos").insert({
        user_id: user.id,
        orden_original_id: orderIdStr,
        numero_orden: orderToDelete.orderNumber,
        total: orderToDelete.total,
        comentario: orderToDelete.comment,
        fecha_orden: orderToDelete.timestamp.toISOString(),
      });

      if (insertError) {
        console.error("Error inserting deleted order:", insertError);
        toast.error("Error al registrar orden eliminada");
        return;
      }

      // Delete order details first (due to foreign key)
      const { error: deleteDetailsError } = await supabase
        .from("detalle_ordenes_pos")
        .delete()
        .eq("orden_id", orderIdStr);

      if (deleteDetailsError) {
        console.error("Error deleting order details:", deleteDetailsError);
      }

      // Delete from main table
      const { error: deleteError } = await supabase
        .from("ordenes_pos")
        .delete()
        .eq("id", orderIdStr);

      if (deleteError) {
        console.error("Error deleting order:", deleteError);
        toast.error("Error al eliminar orden de la base de datos");
        return;
      }

      // Update local state
      setCompletedOrders(prev => prev.filter(order => String(order.id) !== orderIdStr));
      setDeletedOrders(prev => [orderToDelete, ...prev]);
      toast.info(`Orden #${orderToDelete.orderNumber} eliminada (inventario restaurado)`);
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error al eliminar orden");
    }
  };

  const handleRestoreOrder = async (orderId: number | string) => {
    const orderToRestore = deletedOrders.find(order => order.id === orderId);
    if (!orderToRestore) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Re-insert into main orders table
      const { data: newOrder, error } = await supabase
        .from("ordenes_pos")
        .insert({
          user_id: user.id,
          numero_orden: orderToRestore.orderNumber,
          total: orderToRestore.total,
          comentario: orderToRestore.comment || null,
          fecha: orderToRestore.timestamp.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Delete from eliminated table
      await supabase.from("ordenes_eliminadas_pos").delete().eq("id", String(orderId));

      const restoredOrder = { ...orderToRestore, id: newOrder.id };
      setDeletedOrders(deletedOrders.filter(order => order.id !== orderId));
      setCompletedOrders([restoredOrder, ...completedOrders]);
      toast.success(`Orden #${orderToRestore.orderNumber} restaurada`);
    } catch (error) {
      console.error("Error restoring order:", error);
      toast.error("Error al restaurar orden");
    }
  };

  const handleExportToExcel = () => {
    const data = completedOrders.map(order => ({
      "Número Orden": order.orderNumber,
      "Fecha": order.timestamp.toLocaleString("es-CO"),
      "Items": order.items.map(i => i.name).join(", "),
      "Total": order.total,
      "Comentario": order.comment || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `ventas_${date}.xlsx`);
    toast.success("Reporte exportado a Excel");
  };

  const handleCalculateChange = () => {
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < currentTotal) {
      toast.error("El monto debe ser mayor o igual al total");
      return;
    }
    setChangeAmount(payment - currentTotal);
  };

  const handleGenerateInvoice = (order: CompletedOrder) => {
    setInvoiceOrder({
      ...order,
      id: String(order.id),
    });
    setShowInvoiceModal(true);
  };

  // ── Load clients for debt selector ──────────────────────────────
  const handleOpenDeudaSelector = async () => {
    setShowDeudaSelector(true);
    setLoadingClientes(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("clientes_cuenta")
        .select("id, nombre, saldo_total, telefono, tipo_cuenta")
        .eq("user_id", user.id)
        .eq("estado", "activo")
        .order("nombre");
      setClientes((data ?? []) as any[]);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoadingClientes(false);
    }
  };

  // ── Charge order to debt account ────────────────────────────────
  const handleCargarADeuda = async () => {
    if (!selectedClienteDeuda) { toast.error("Selecciona un cliente"); return; }
    if (pendingOrderItems.length === 0) { toast.error("No hay ítems en la orden"); return; }
    setCargandoDeuda(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      const clienteData = clientes.find(c => c.id === selectedClienteDeuda);
      const esInterno = clienteData?.tipo_cuenta === "consumo_interno";
      const total = pendingOrderItems.reduce((s, i) => s + i.price, 0);

      // 1. Create ventas_credito header (traceability for both types)
      const { data: venta, error: ve } = await supabase
        .from("ventas_credito")
        .insert({
          user_id: user.id,
          cliente_id: selectedClienteDeuda,
          total,
          notas: pendingOrderComment || `Orden POS #${orderNumber}`,
        })
        .select()
        .single();
      if (ve) throw ve;

      // 2. Insert detail items
      const detalles = pendingOrderItems.map(i => ({
        venta_id: venta.id,
        nombre_item: i.name,
        cantidad: 1,
        precio_unitario: i.price,
        subtotal: i.price,
      }));
      const { error: de } = await supabase.from("detalle_ventas_credito").insert(detalles);
      if (de) throw de;

      // 3. Deduct inventory for ALL account types
      const stockWarnings: string[] = [];
      for (const item of pendingOrderItems) {
        if (item.tipo_item === 'retail') {
          const { data: menuItemData } = await supabase
            .from("menu_items").select("stock_actual").eq("id", item.id).single();
          if (menuItemData) {
            if (menuItemData.stock_actual <= 0) stockWarnings.push(`⚠️ ${item.name}: SIN STOCK`);
            else if (menuItemData.stock_actual < 3) stockWarnings.push(`⚡ ${item.name}: Stock bajo`);
            await supabase.from("menu_items").update({ stock_actual: menuItemData.stock_actual - 1 }).eq("id", item.id);
          }
        } else if (item.tipo_item === 'receta') {
          const { data: recetaData } = await supabase
            .from("recetas")
            .select(`id, detalle_recetas (insumo_id, cantidad_insumo_por_unidad, insumo:productos!detalle_recetas_insumo_id_fkey (id, nombre, stock_actual, costo_promedio))`)
            .eq("menu_item_id", item.id).maybeSingle();
          if (recetaData?.detalle_recetas) {
            for (const dr of recetaData.detalle_recetas) {
              const insumo = dr.insumo as any;
              const cant = dr.cantidad_insumo_por_unidad;
              if (insumo.stock_actual <= 0) stockWarnings.push(`⚠️ ${insumo.nombre}: SIN STOCK`);
              else if (insumo.stock_actual < cant) stockWarnings.push(`⚠️ ${insumo.nombre}: Stock insuficiente`);
              const nuevoStock = insumo.stock_actual - cant;
              await supabase.from("productos").update({ stock_actual: nuevoStock }).eq("id", insumo.id);
              await supabase.from("movimientos_inventario").insert({
                producto_id: insumo.id, tipo_movimiento: "consumo", cantidad: cant,
                stock_resultante: nuevoStock, costo_unitario_referencia: insumo.costo_promedio,
                referencia: esInterno ? `Consumo Interno - #${orderNumber}` : `Cuenta Cliente - #${orderNumber}`,
                notas: `Consumo para: ${item.name}`, user_id: user.id,
              });
            }
          }
        }
      }

      if (stockWarnings.length > 0) {
        toast.warning("Alerta de inventario", { description: stockWarnings.slice(0, 3).join('\n'), duration: 5000 });
      }

      // 4. Only register POS order for REAL client accounts (not internal consumption)
      if (!esInterno) {
        const { data: newOrder, error: oe } = await supabase
          .from("ordenes_pos")
          .insert({
            user_id: user.id, numero_orden: orderNumber, total,
            comentario: `[CUENTA CLIENTE] ${pendingOrderComment || ""}`,
            fecha: new Date().toISOString(),
          })
          .select().single();
        if (oe) throw oe;

        await supabase.from("detalle_ordenes_pos").insert(
          pendingOrderItems.map(i => ({
            orden_id: newOrder.id, menu_item_id: i.id, nombre_item: i.name,
            precio_unitario: i.price, cantidad: 1, subtotal: i.price,
          }))
        );

        setCompletedOrders(prev => [{
          id: newOrder.id, orderNumber, total,
          items: pendingOrderItems.map(i => ({ name: i.name, price: i.price })),
          comment: pendingOrderComment, timestamp: new Date(),
        }, ...prev]);
      }

      const clienteNombre = clienteData?.nombre ?? "cliente";
      setOrderNumber(orderNumber + 1);
      setCurrentItems([]);
      setComment("");
      setPendingOrderItems([]);
      setPendingOrderComment("");
      setShowCompleteOptions(false);
      setShowDeudaSelector(false);
      setSelectedClienteDeuda("");
      toast.success(esInterno
        ? `Consumo interno registrado para ${clienteNombre} (sin facturación)`
        : `Cargado a la cuenta de ${clienteNombre}`);
    } catch (e: any) {
      toast.error("Error al cargar a deuda");
      console.error(e);
    } finally {
      setCargandoDeuda(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {menuItems.length === 0 ? (
        <div className="text-center py-12 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">¡Bienvenido a tu POS!</h2>
          
          {!storeName && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <label className="block text-sm font-medium mb-2 text-left">
                <Store className="inline h-4 w-4 mr-1" />
                Nombre de tu comercio
              </label>
              <div className="flex gap-2">
                <Input
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                  placeholder="Ej: Mi Cafetería"
                  className="flex-1"
                />
                <Button 
                  onClick={async () => {
                    if (!storeNameInput.trim()) {
                      toast.error("Ingresa un nombre para tu comercio");
                      return;
                    }
                    setSavingStoreName(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      
                      const { error } = await supabase
                        .from("user_settings")
                        .upsert({
                          user_id: user.id,
                          store_name: storeNameInput.trim()
                        }, { onConflict: 'user_id' });
                      
                      if (error) throw error;
                      setStoreName(storeNameInput.trim());
                      toast.success("Nombre guardado");
                    } catch (error) {
                      toast.error("Error al guardar");
                    } finally {
                      setSavingStoreName(false);
                    }
                  }}
                  disabled={savingStoreName}
                >
                  {savingStoreName ? "..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
          
          {storeName && (
            <p className="text-lg font-medium text-primary mb-4">{storeName}</p>
          )}
          
          <p className="text-muted-foreground mb-6">
            Aún no tienes items en tu menú. Crea tu primer item para comenzar a vender.
          </p>
          <Button onClick={() => navigate("/menu")}>
            <Menu className="mr-2 h-4 w-4" />
            Configurar Mi Menú
          </Button>
        </div>
      ) : (
        <>
          {/* Caja Status Banner */}
          <div className={`flex items-center justify-between px-4 py-2 rounded-lg mb-4 border ${cajaAbierta ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-destructive/10 border-destructive/30'}`}>
            <div className="flex items-center gap-2">
              <DollarSign className={`h-4 w-4 ${cajaAbierta ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`} />
              <span className={`text-sm font-medium ${cajaAbierta ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                {cajaAbierta === null ? 'Verificando caja...' : cajaAbierta ? 'Caja abierta' : 'Caja cerrada — se abrirá al completar la primera orden'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cajaAbierta && (
                <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400 dark:border-green-700 text-xs">
                  Activa
                </Badge>
              )}
              {/* Export Button */}
              <Button variant="outline" size="sm" onClick={handleExportToExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted p-2">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(itemsByCategory[category] ?? []).map((item) => (
                          <MenuItemButton
                            key={item.id}
                            item={item}
                            onAdd={handleAddItem}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Current Order Section */}
            <div className="space-y-4">
              {/* Active Order Indicator */}
              {selectedActiveOrder && (
                <Card className="border-2 border-primary bg-primary/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Orden Activa #{selectedActiveOrder.numero_orden}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedActiveOrder(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {selectedActiveOrder.nombre_cliente && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" /> {selectedActiveOrder.nombre_cliente}
                        </span>
                      )}
                      {selectedActiveOrder.mesa && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />Mesa #{selectedActiveOrder.mesa.numero_mesa}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Banner informativo */}
                    <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary rounded px-2 py-1.5 font-medium">
                      <ClipboardList className="w-3 h-3 shrink-0" />
                      Los items del menú se agregarán a esta orden
                    </div>

                    {/* Lista de items */}
                    <div className="rounded-md border border-border overflow-hidden">
                      <div className="bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Items ({selectedActiveOrder.detalles.length})
                      </div>
                      {selectedActiveOrder.detalles.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          Sin items — selecciona del menú
                        </div>
                      ) : (
                        <div className="divide-y divide-border max-h-48 overflow-y-auto">
                          {selectedActiveOrder.detalles.map((detalle) => (
                            <div key={detalle.id} className="flex justify-between items-center px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{detalle.nombre_item}</p>
                                <p className="text-xs text-muted-foreground">{detalle.cantidad}x {formatPrice(detalle.precio_unitario)}</p>
                              </div>
                              <span className="text-sm font-semibold ml-2 shrink-0">{formatPrice(detalle.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center px-3 py-2 bg-muted/40 border-t border-border">
                        <span className="text-sm font-bold">Total</span>
                        <span className="text-base font-bold text-primary">{formatPrice(selectedActiveOrder.total)}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleCloseActiveOrder}
                      disabled={closingActiveOrder || selectedActiveOrder.detalles.length === 0}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {closingActiveOrder ? "Cerrando..." : "Cerrar Cuenta"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Normal current order (when no active order selected) */}
              {!selectedActiveOrder && (
                <>
                  <CurrentOrder
                    items={currentItems}
                    comment={comment}
                    onCommentChange={setComment}
                    onRemoveItem={handleRemoveItem}
                    onCompleteOrder={handleShowCompleteOptions}
                    onSendToActive={handleShowCompleteOptions}
                    orderNumber={orderNumber}
                    isCompleting={isCompletingOrder}
                  />

                  {currentItems.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowChangeCalculator(true)}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Calcular Cambio
                    </Button>
                  )}
                </>
              )}

              {/* Active Orders Panel */}
              <Card>
                <CardContent className="pt-4">
                  <ActiveOrdersPanel
                    menuItems={menuItems}
                    onSelectActiveOrder={setSelectedActiveOrder}
                    selectedActiveOrder={selectedActiveOrder}
                    refreshKey={activeOrdersKey}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order History Section */}
          <div className="mt-8">
            <Tabs defaultValue="completed" className="w-full">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="completed" className="flex-1">
                  Órdenes Completadas ({completedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1">
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Activas
                </TabsTrigger>
                <TabsTrigger value="deleted" className="flex-1">
                  Eliminadas ({deletedOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="completed" className="mt-4">
                <OrderHistory
                  orders={completedOrders}
                  onSelectOrder={handleSelectOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="active" className="mt-4">
                <ActiveOrdersHistory
                  refreshKey={activeOrdersKey}
                  onSelectOrder={(orden) => {
                    setSelectedActiveOrder(orden);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </TabsContent>
              <TabsContent value="deleted" className="mt-4">
                <DeletedOrders
                  orders={deletedOrders}
                  onSelectOrder={handleSelectOrder}
                  onRestoreOrder={handleRestoreOrder}
                />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Order Detail Dialog */}
      <OrderDetail
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Invoice Generation Modal */}
      {invoiceOrder && (
        <GenerarFactura
          orden={{
            id: String(invoiceOrder.id),
            orderNumber: invoiceOrder.orderNumber,
            items: invoiceOrder.items,
            total: invoiceOrder.total,
            comment: invoiceOrder.comment,
            timestamp: invoiceOrder.timestamp,
          }}
          open={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceOrder(null);
          }}
        />
      )}

      {/* Change Calculator Dialog */}
      <Dialog open={showChangeCalculator} onOpenChange={setShowChangeCalculator}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcular Cambio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(currentTotal)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Monto recibido
              </label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setChangeAmount(null);
                }}
                placeholder="Ingresa el monto"
                className="text-lg"
              />
            </div>

            <Button onClick={handleCalculateChange} className="w-full">
              Calcular
            </Button>

            {changeAmount !== null && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Devuelta</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(changeAmount)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Order Options Dialog */}
      <Dialog open={showCompleteOptions} onOpenChange={setShowCompleteOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué deseas hacer con esta orden?</DialogTitle>
            <DialogDescription>
              Total: {formatPrice(pendingOrderItems.reduce((sum, item) => sum + item.price, 0))} ({pendingOrderItems.length} items)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Option 1: Complete order immediately */}
            <Button 
              className="w-full h-auto p-4 flex flex-col items-start gap-2" 
              onClick={handleCompleteOrder}
              disabled={isCompletingOrder || isSendingToActive}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Check className="w-5 h-5" />
                Completar Orden
              </div>
              <span className="text-xs text-primary-foreground/80 text-left">
                Facturar ahora y registrar como venta
              </span>
            </Button>

            {/* Option 2: Charge to debt account */}
            <button
              className="w-full h-auto p-4 flex flex-col items-start gap-2 rounded-lg border-2 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left disabled:opacity-50"
              onClick={handleOpenDeudaSelector}
              disabled={isCompletingOrder || isSendingToActive || cargandoDeuda}
            >
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <CreditCard className="w-5 h-5" />
                Cargar a Cuenta de Cliente
              </div>
              <span className="text-xs text-muted-foreground">
                Registra la venta como deuda en la cuenta del cliente
              </span>
            </button>

            {/* Option 3: Send to active orders */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <ShoppingBag className="w-5 h-5" />
                Enviar a Órdenes Activas
              </div>
              <p className="text-xs text-muted-foreground">
                La orden queda pendiente hasta cerrar la cuenta
              </p>
              
              <div className="space-y-2">
                <Label className="text-sm">Mesa (opcional)</Label>
                <Select value={sendToActiveMesa || "none"} onValueChange={(val) => setSendToActiveMesa(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin mesa asignada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin mesa</SelectItem>
                    {availableMesas.map((mesa) => (
                      <SelectItem key={mesa.id} value={mesa.id}>
                        Mesa #{mesa.numero_mesa} {mesa.nombre && `(${mesa.nombre})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Cliente (opcional)</Label>
                <Input
                  value={sendToActiveCliente}
                  onChange={(e) => setSendToActiveCliente(e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>

              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleSendToActiveOrders}
                disabled={isSendingToActive || isCompletingOrder}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isSendingToActive ? "Enviando..." : "Enviar a Activas"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteOptions(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Seleccionar cliente para deuda ───────────────── */}
      <Dialog open={showDeudaSelector} onOpenChange={v => { setShowDeudaSelector(v); if (!v) setSelectedClienteDeuda(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-400" />
              Cargar a cuenta de cliente
            </DialogTitle>
            <DialogDescription>
              {formatPrice(pendingOrderItems.reduce((s, i) => s + i.price, 0))} · {pendingOrderItems.length} item{pendingOrderItems.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {loadingClientes ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando clientes...</p>
            ) : clientes.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">No hay clientes registrados aún.</p>
                <Button size="sm" variant="outline" onClick={() => { setShowDeudaSelector(false); navigate("/finanzas/cuentas-deuda"); }}>
                  Ir a Cuentas en Deuda
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {clientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClienteDeuda(c.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors
                      ${selectedClienteDeuda === c.id
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-border hover:border-amber-500/30 hover:bg-muted/50"}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{c.nombre}</p>
                        {c.tipo_cuenta === "consumo_interno" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">Interno</Badge>
                        )}
                      </div>
                      {c.telefono && <p className="text-xs text-muted-foreground">{c.telefono}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Saldo actual</p>
                      <p className={`text-sm font-bold ${c.saldo_total > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {formatPrice(c.saldo_total)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedClienteDeuda && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Saldo después de cargar</p>
                <p className="font-bold text-amber-400">
                  {formatPrice((clientes.find(c => c.id === selectedClienteDeuda)?.saldo_total ?? 0) + pendingOrderItems.reduce((s, i) => s + i.price, 0))}
                </p>
              </div>
            )}
            <Button className="w-full" onClick={handleCargarADeuda}
              disabled={!selectedClienteDeuda || cargandoDeuda}>
              {cargandoDeuda ? "Cargando..." : "Confirmar cargo a cuenta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Abrir Caja (auto-trigger) ───────────────────────── */}
      <Dialog open={showAbrirCajaDialog} onOpenChange={(open) => {
        setShowAbrirCajaDialog(open);
        if (!open) pendingActionRef.current = null;
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Abrir Caja para continuar
            </DialogTitle>
            <DialogDescription>
              No hay caja abierta. Registra el monto base para comenzar a facturar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Monto de apertura (base de caja)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 50000"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Puedes ingresar 0 si no tienes base inicial</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                placeholder="Observaciones..."
                value={notasApertura}
                onChange={(e) => setNotasApertura(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAbrirCajaDialog(false); pendingActionRef.current = null; }}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleAbrirCajaPOS}
              disabled={abriendo}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {abriendo ? "Abriendo..." : "Abrir Caja y continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default POS;

