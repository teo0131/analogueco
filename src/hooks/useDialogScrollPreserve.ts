import { useState, useRef, useCallback } from 'react';

/**
 * Hook que preserva la posición de scroll cuando se abre/cierra un diálogo.
 * Guarda la posición antes de abrir y la restaura al cerrar.
 */
export const useDialogScrollPreserve = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const scrollPositionRef = useRef(0);

  const openDialog = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  }, []);

  const setDialogOpen = useCallback((open: boolean) => {
    if (open) {
      scrollPositionRef.current = window.scrollY;
      setIsOpen(true);
    } else {
      setIsOpen(false);
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
  }, []);

  // Para usar después de operaciones async (como guardar datos)
  const restoreScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  }, []);

  return {
    isOpen,
    openDialog,
    closeDialog,
    setDialogOpen,
    restoreScroll,
    scrollPositionRef,
  };
};
