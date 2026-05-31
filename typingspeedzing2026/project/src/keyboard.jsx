// keyboard.jsx — on-screen keyboard with next-key highlight + error heatmap
// Exposes <Keyboard /> on window.

const KB_ROWS = [
  [["Backquote","`","~","ฺ","ฤ"],["Digit1","1","!","ๅ","+"],["Digit2","2","@","/","๑"],["Digit3","3","#","-","๒"],["Digit4","4","$","ภ","๓"],["Digit5","5","%","ถ","๔"],["Digit6","6","^","ุ","ู"],["Digit7","7","&","ึ","฿"],["Digit8","8","*","ค","๕"],["Digit9","9","(","ต","๖"],["Digit0","0",")","จ","๗"],["Minus","-","_","ข","๘"],["Equal","=","+","ช","๙"]],
  [["KeyQ","q","Q","ๆ","๐"],["KeyW","w","W","ไ","\""],["KeyE","e","E","ำ","ฎ"],["KeyR","r","R","พ","ฑ"],["KeyT","t","T","ะ","ธ"],["KeyY","y","Y","ั","ํ"],["KeyU","u","U","ี","๊"],["KeyI","i","I","ร","ณ"],["KeyO","o","O","น","ฯ"],["KeyP","p","P","ย","ญ"],["BracketLeft","[","{","บ","ฐ"],["BracketRight","]","}","ล",","]],
  [["KeyA","a","A","ฟ","ฤ"],["KeyS","s","S","ห","ฆ"],["KeyD","d","D","ก","ฏ"],["KeyF","f","F","ด","โ"],["KeyG","g","G","เ","ฌ"],["KeyH","h","H","้","็"],["KeyJ","j","J","่","๋"],["KeyK","k","K","า","ษ"],["KeyL","l","L","ส","ศ"],["Semicolon",";",":","ว","ซ"],["Quote","'","\"","ง","."]],
  [["KeyZ","z","Z","ผ","("],["KeyX","x","X","ป",")"],["KeyC","c","C","แ","ฉ"],["KeyV","v","V","อ","ฮ"],["KeyB","b","B","ิ","ฺ"],["KeyN","n","N","ื","์"],["KeyM","m","M","ท","?"],["Comma",",","<","ม","ฒ"],["Period",".",">","ใ","ฬ"],["Slash","/","?","ฝ","ฦ"]],
];

const FINGER_ROW = "row"; // unused placeholder

function physicalForChar(ch, lang) {
  if (ch === " ") return "Space";
  if (lang === "th") {
    if (window.TH_TO_PHYSICAL[ch]) return window.TH_TO_PHYSICAL[ch];
  }
  const lower = ch.toLowerCase();
  // find by primary or shift legend
  for (const row of KB_ROWS) {
    for (const k of row) {
      if (k[1] === lower || k[1] === ch || k[2] === ch) return k[0];
    }
  }
  return null;
}

function Keyboard({ lang, nextChar, lastCode, heatmap, showHeatmap, accent }) {
  const nextCode = window.physicalForChar(nextChar, lang);
  const maxErr = React.useMemo(() => {
    let m = 1; for (const k in heatmap) m = Math.max(m, heatmap[k]); return m;
  }, [heatmap]);

  const KeyCap = ({ code, main, shift, th }) => {
    const isNext = code === nextCode;
    const isActive = code === lastCode;
    const err = heatmap[code] || 0;
    const heat = showHeatmap && err > 0 ? err / maxErr : 0;
    const style = {
      "--heat": heat,
    };
    let cls = "kbd-key";
    if (isNext) cls += " kbd-next";
    if (isActive) cls += " kbd-active";
    if (showHeatmap && err > 0) cls += " kbd-heat";
    return (
      <div className={cls} style={style} data-code={code}>
        <span className="kbd-main">{lang === "th" ? (th || main) : main}</span>
        {lang === "th" && th ? <span className="kbd-sub">{main}</span> : (shift && shift !== main.toUpperCase() && shift.length === 1 ? <span className="kbd-sub">{shift}</span> : null)}
      </div>
    );
  };

  return (
    <div className="kbd">
      {KB_ROWS.map((row, ri) => (
        <div className={"kbd-row kbd-row-" + ri} key={ri}>
          {ri === 2 ? <div className="kbd-key kbd-mod" style={{ flex: "1.5" }}>caps</div> : null}
          {ri === 3 ? <div className="kbd-key kbd-mod" style={{ flex: "2" }}>shift</div> : null}
          {row.map((k) => (
            <KeyCap key={k[0]} code={k[0]} main={k[1]} shift={k[2]} th={k[3]} />
          ))}
          {ri === 0 ? <div className="kbd-key kbd-mod" style={{ flex: "2" }}>⌫</div> : null}
          {ri === 1 ? <div className="kbd-key kbd-mod" style={{ flex: "1.5" }}>⏎</div> : null}
          {ri === 3 ? <div className="kbd-key kbd-mod" style={{ flex: "2" }}>shift</div> : null}
        </div>
      ))}
      <div className="kbd-row kbd-row-space">
        <div className={"kbd-key kbd-space" + (nextCode === "Space" ? " kbd-next" : "") + (lastCode === "Space" ? " kbd-active" : "")} data-code="Space">space</div>
      </div>
    </div>
  );
}

Object.assign(window, { Keyboard, physicalForChar, KB_ROWS });
