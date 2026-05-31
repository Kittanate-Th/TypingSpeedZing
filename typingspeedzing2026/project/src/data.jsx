// data.jsx — word banks (EN + TH), lessons, AI text helper, keyboard maps
// Exposed on window for other babel scripts.

const EN_WORDS = ("the be of and a to in he have it that for they i with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line").split(" ");

const TH_WORDS = ("การ ความ ที่ และ ของ ใน เป็น มี ได้ ให้ ไม่ จะ มา กับ ว่า นี้ คน วัน ดี ทำ ไป อยู่ แล้ว ต้อง เรา เขา กัน เพราะ หรือ แต่ ถ้า เมื่อ จาก โดย เพื่อ ตาม อย่าง ก็ มาก น้อย ใหม่ เก่า ใหญ่ เล็ก สูง ต่ำ เร็ว ช้า ดี งาน บ้าน เมือง โลก ชีวิต เวลา เรื่อง ทาง น้ำ ไฟ ลม ดิน ฟ้า รัก คิด รู้ เห็น พูด ฟัง เดิน นั่ง ยืน นอน กิน เล่น เรียน สอน อ่าน เขียน จำ ลืม หวัง ฝัน สร้าง ใช้ เปิด ปิด เริ่ม จบ พบ หา เจอ ช่วย ขอ บอก ถาม ตอบ ชอบ กลัว สุข เศร้า ยิ้ม หัวเราะ").split(" ");

const EN_QUOTES = [
  "the quick brown fox jumps over the lazy dog while the sun sets behind the quiet hills",
  "every keystroke is a small act of intention and the rhythm of your hands becomes a kind of music",
  "speed is the natural result of accuracy practiced patiently over a long stretch of ordinary days",
  "the best way to predict the future is to build it one careful line at a time without rushing",
];

const TH_QUOTES = [
  "การฝึกพิมพ์ทุกวันคือการลงทุนเล็กๆ ที่ให้ผลตอบแทนมหาศาลในระยะยาวอย่างเงียบงัน",
  "ความเร็วเกิดจากความแม่นยำที่ฝึกฝนอย่างอดทนสม่ำเสมอไม่ใช่จากการรีบเร่ง",
  "นิ้วทุกนิ้วมีหน้าที่ของมันเมื่อเราเชื่อใจกล้ามเนื้อความเร็วจะตามมาเอง",
];

const LESSONS = [
  { id: "home", name: { en: "Home Row", th: "แป้นเหย้า" }, words: "fff jjj ddd kkk sss lll aaa ;;; fjf dkd sls a;a jfj kdk fdsa jkl; asdf ;lkj fjdk sla; dad sad lad fall jazz alas".split(" ") },
  { id: "top", name: { en: "Top Row", th: "แป้นบน" }, words: "qqq www eee rrr ttt yyy uuu iii ooo ppp qwer tyui op we rot you put tire wire quiet write your power".split(" ") },
  { id: "bottom", name: { en: "Bottom Row", th: "แป้นล่าง" }, words: "zzz xxx ccc vvv bbb nnn mmm zxc vbn m, max van can man box mix zone come move number machine".split(" ") },
  { id: "numbers", name: { en: "Numbers", th: "ตัวเลข" }, words: "123 456 789 012 1024 2048 3.14 42 365 1995 2026 50% 99.9 100 7th 8x9 64kb 256 512".split(" ") },
  { id: "punct", name: { en: "Punctuation", th: "เครื่องหมาย" }, words: "well, yes. no! why? (ok) [done] {go} a-b c/d e_f g+h \"hi\" 'go' 100% @home #tag".split(" ") },
];

// Thai Kedmanee → physical QWERTY key code mapping (for next-key highlight)
const TH_TO_PHYSICAL = {
  "ๆ":"KeyR","ไ":"KeyQ","ำ":"KeyW","พ":"KeyE","ะ":"KeyT","ั":"KeyY","ี":"KeyU","ร":"KeyI","น":"KeyO","ย":"KeyP",
  "บ":"BracketLeft","ล":"BracketRight","ฟ":"KeyA","ห":"KeyS","ก":"KeyD","ด":"KeyF","เ":"KeyG","้":"KeyH","่":"KeyJ","า":"KeyK","ส":"KeyL",
  "ว":"Semicolon","ง":"Quote","ผ":"KeyZ","ป":"KeyX","แ":"KeyC","อ":"KeyV","ิ":"KeyB","ื":"KeyN","ท":"KeyM","ม":"Comma","ใ":"Period","ฝ":"Slash",
  "ต":"Key5","จ":"Key6","ข":"Key7","ช":"Key8","ถ":"KeyBackquote","ุ":"KeyKeyDummy",
};

// Build a randomized word string
function buildWords(lang, count) {
  const bank = lang === "th" ? TH_WORDS : EN_WORDS;
  const out = [];
  for (let i = 0; i < count; i++) out.push(bank[Math.floor(Math.random() * bank.length)]);
  return out.join(" ");
}

function pickQuote(lang) {
  const bank = lang === "th" ? TH_QUOTES : EN_QUOTES;
  return bank[Math.floor(Math.random() * bank.length)];
}

// AI text generation with graceful fallback
async function aiGenerate(lang, topic) {
  const fallback = () => buildWords(lang, 40);
  try {
    if (!window.claude || !window.claude.complete) return fallback();
    const langName = lang === "th" ? "Thai" : "English";
    const t = topic && topic.trim() ? topic.trim() : (lang === "th" ? "ความคิดสร้างสรรค์และเทคโนโลยี" : "creativity and technology");
    const prompt = `Write ONE flowing ${langName} passage of about 45 words for a typing practice test, on the theme: "${t}". Lowercase, common words, no rare jargon, no markdown, no quotes around it, no line breaks. Return ONLY the passage text.`;
    const res = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
    const cleaned = (res || "").replace(/[\n\r]+/g, " ").replace(/^["']|["']$/g, "").trim();
    return cleaned.length > 10 ? cleaned : fallback();
  } catch (e) {
    return fallback();
  }
}

Object.assign(window, { EN_WORDS, TH_WORDS, EN_QUOTES, TH_QUOTES, LESSONS, TH_TO_PHYSICAL, buildWords, pickQuote, aiGenerate });
