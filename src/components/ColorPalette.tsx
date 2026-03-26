const COLORS = [
  "#000000", "#808080", "#800000", "#808000",
  "#008000", "#008080", "#000080", "#800080",
  "#808040", "#004040", "#0080ff", "#004080",
  "#4000ff", "#804000",
  "#ffffff", "#c0c0c0", "#ff0000", "#ffff00",
  "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
  "#ffff80", "#00ff80", "#80ffff", "#8080ff",
  "#ff0080", "#ff8040",
];

interface ColorPaletteProps {
  color: string;
  onColorChange: (color: string) => void;
}

export default function ColorPalette({ color, onColorChange }: ColorPaletteProps) {
  return (
    <div className="color-palette">
      <div className="color-current">
        <div className="color-current-fg" style={{ background: color }} />
      </div>
      <div className="color-grid">
        {COLORS.map((c) => (
          <div
            key={c}
            className={`color-swatch ${color === c ? "active" : ""}`}
            style={{ background: c }}
            onMouseDown={() => onColorChange(c)}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
