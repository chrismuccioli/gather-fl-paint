import { useState, useEffect, useRef } from "react";

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  onNewFile: () => void;
  onOpenFromPlot: () => void;
  onSaveToPlot: () => void;
  onSaveLocal: () => void;
  onUndo: () => void;
  onFlatten: () => void;
  onResize: () => void;
  onToggleLayers: () => void;
  layersVisible: boolean;
}

export default function MenuBar({
  onNewFile,
  onOpenFromPlot,
  onSaveToPlot,
  onSaveLocal,
  onUndo,
  onFlatten,
  onResize,
  onToggleLayers,
  layersVisible,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const menus: MenuDef[] = [
    {
      label: "File",
      items: [
        { label: "New", shortcut: "Ctrl+N", action: onNewFile },
        { label: "Open from Plot…", shortcut: "Ctrl+O", action: onOpenFromPlot },
        { label: "", separator: true },
        { label: "Save to Plot…", shortcut: "Ctrl+S", action: onSaveToPlot },
        { label: "Save to Disk…", action: onSaveLocal },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "Ctrl+Z", action: onUndo },
        { label: "", separator: true },
        { label: "Flatten Image", action: onFlatten },
        { label: "Resize Canvas…", action: onResize },
      ],
    },
    {
      label: "View",
      items: [
        {
          label: layersVisible ? "✓ Layers Panel" : "  Layers Panel",
          action: onToggleLayers,
        },
      ],
    },
  ];

  // Close on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  return (
    <div className="menu-bar" ref={barRef}>
      {menus.map((menu) => (
        <div
          key={menu.label}
          className="menu-bar-item"
          onMouseDown={() =>
            setOpenMenu((prev) => (prev === menu.label ? null : menu.label))
          }
          onMouseEnter={() => {
            if (openMenu) setOpenMenu(menu.label);
          }}
        >
          {menu.label}
          {openMenu === menu.label && (
            <div className="menu-dropdown">
              {menu.items.map((item, i) =>
                item.separator ? (
                  <div key={i} className="menu-dropdown-sep" />
                ) : (
                  <div
                    key={i}
                    className="menu-dropdown-item"
                    style={item.disabled ? { color: "#808080" } : undefined}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!item.disabled && item.action) {
                        item.action();
                        setOpenMenu(null);
                      }
                    }}
                  >
                    {item.label}
                    {item.shortcut && (
                      <span className="menu-dropdown-item-shortcut">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
