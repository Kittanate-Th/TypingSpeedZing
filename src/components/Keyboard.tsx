import { KB_ROWS, physicalForChar } from "../data/thaiKeymap";
import type { Lang } from "../types";

interface KeyboardProps {
  lang: Lang;
  nextChar: string;
  lastCode: string | null;
  heatmap: Record<string, number>;
  showHeatmap: boolean;
}

export function Keyboard({ lang, nextChar, lastCode, heatmap, showHeatmap }: KeyboardProps) {
  const nextCode = physicalForChar(nextChar, lang);
  const maxError = Math.max(1, ...Object.values(heatmap));

  return (
    <div className="kbd" aria-label="On-screen keyboard">
      {KB_ROWS.map((row, rowIndex) => (
        <div className={`kbd-row kbd-row-${rowIndex}`} key={rowIndex}>
          {rowIndex === 2 ? <div className="kbd-key kbd-mod">caps</div> : null}
          {rowIndex === 3 ? <div className="kbd-key kbd-mod wide">shift</div> : null}
          {row.map(([code, latin, latinShift, thai]) => {
            const errorCount = heatmap[code] ?? 0;
            const heat = showHeatmap && errorCount > 0 ? errorCount / maxError : 0;
            const classes = [
              "kbd-key",
              code === nextCode ? "kbd-next" : "",
              code === lastCode ? "kbd-active" : "",
              heat > 0 ? "kbd-heat" : "",
            ].filter(Boolean).join(" ");

            return (
              <div
                className={classes}
                data-code={code}
                key={code}
                style={{ "--heat": heat } as React.CSSProperties}
              >
                <span className="kbd-main">{lang === "th" ? thai : latin}</span>
                <span className="kbd-sub">{lang === "th" ? latin : latinShift}</span>
              </div>
            );
          })}
          {rowIndex === 0 ? <div className="kbd-key kbd-mod wide">bksp</div> : null}
          {rowIndex === 1 ? <div className="kbd-key kbd-mod">enter</div> : null}
          {rowIndex === 3 ? <div className="kbd-key kbd-mod wide">shift</div> : null}
        </div>
      ))}
      <div className="kbd-row kbd-row-space">
        <div
          className={[
            "kbd-key",
            "kbd-space",
            nextCode === "Space" ? "kbd-next" : "",
            lastCode === "Space" ? "kbd-active" : "",
          ].filter(Boolean).join(" ")}
        >
          space
        </div>
      </div>
    </div>
  );
}
