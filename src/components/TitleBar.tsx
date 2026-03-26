interface TitleBarProps {
  fileName: string;
}

export default function TitleBar({ fileName }: TitleBarProps) {
  return (
    <div className="title-bar">
      <span style={{ fontSize: 14, marginRight: 2 }}>🌸</span>
      <span className="title-bar-text">
        {fileName || "untitled"} - FLPaint
      </span>
      <div className="title-bar-controls">
        <button>_</button>
        <button>□</button>
        <button>×</button>
      </div>
    </div>
  );
}
