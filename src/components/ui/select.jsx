"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const DropdownContext = createContext(null);
const VIEWPORT_GAP = 8;
const MENU_GAP = 4;

export function Dropdown({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event) {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

Dropdown.Trigger = function DropdownTrigger({
  children,
  className = "",
  ...props
}) {
  const { open, setOpen, triggerRef } = useContext(DropdownContext);
  return (
    <button
      {...props}
      ref={triggerRef}
      type="button"
      className={className}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((currentlyOpen) => !currentlyOpen)}
    >
      {children}
    </button>
  );
};

Dropdown.Content = function DropdownContent({
  children,
  align = "left",
  className = "",
}) {
  const { open, setOpen, triggerRef, contentRef } =
    useContext(DropdownContext);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const matchTriggerWidth = className.split(/\s+/).includes("w-full");
    const menuWidth = matchTriggerWidth ? triggerRect.width : menuRect.width;
    const spaceBelow =
      viewportHeight - triggerRect.bottom - MENU_GAP - VIEWPORT_GAP;
    const spaceAbove = triggerRect.top - MENU_GAP - VIEWPORT_GAP;
    const placeAbove = menuRect.height > spaceBelow && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      placeAbove ? spaceAbove : spaceBelow,
      0,
    );
    const menuHeight = Math.min(
      menuRect.height,
      availableHeight,
      viewportHeight - VIEWPORT_GAP * 2,
    );
    const left =
      align === "right"
        ? triggerRect.right - menuWidth
        : triggerRect.left;
    const maxLeft = Math.max(
      VIEWPORT_GAP,
      viewportWidth - menuWidth - VIEWPORT_GAP,
    );
    const top = placeAbove
      ? triggerRect.top - MENU_GAP - menuHeight
      : triggerRect.bottom + MENU_GAP;

    setPosition({
      top: Math.min(
        Math.max(top, VIEWPORT_GAP),
        Math.max(VIEWPORT_GAP, viewportHeight - menuHeight - VIEWPORT_GAP),
      ),
      left: Math.min(Math.max(left, VIEWPORT_GAP), maxLeft),
      width: matchTriggerWidth ? triggerRect.width : undefined,
      maxHeight:
        menuRect.height > availableHeight ? availableHeight : undefined,
    });
  }, [align, className, contentRef, open, position?.width, triggerRef]);

  useEffect(() => {
    if (!open) return;

    function closeOnScrollOrResize() {
      setOpen(false);
    }

    function closeOnScroll(event) {
      if (contentRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScrollOrResize);

    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScrollOrResize);
    };
  }, [contentRef, open, setOpen]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width,
        maxHeight: position?.maxHeight,
        visibility: position ? "visible" : "hidden",
        overflowY: "auto",
        zIndex: 1000,
      }}
      className={`min-w-[160px] rounded-[6px] border border-border bg-background py-1 shadow-[0_4px_16px_rgba(10,27,57,0.08)] ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
};

Dropdown.Item = function DropdownItem({
  children,
  onSelect,
  destructive = false,
  className = "",
}) {
  const { setOpen } = useContext(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={`block w-full px-3 py-2 text-left text-sm hover:bg-hover
        ${destructive ? "text-[#ef1e1e]" : "text-foreground"} ${className}`}
    >
      {children}
    </button>
  );
};

Dropdown.Separator = function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
};
