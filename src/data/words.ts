// Practice corpora (ported verbatim from the design prototype) + helpers.
// These are content, not logic; see docs/SPEC.md §7.
import type { Lang } from "../types";

export const EN_WORDS = (
  "the be of and a to in he have it that for they i with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line"
).split(" ");

export const TH_WORDS = (
  "การ ความ ที่ และ ของ ใน เป็น มี ได้ ให้ ไม่ จะ มา กับ ว่า นี้ คน วัน ดี ทำ ไป อยู่ แล้ว ต้อง เรา เขา กัน เพราะ หรือ แต่ ถ้า เมื่อ จาก โดย เพื่อ ตาม อย่าง ก็ มาก น้อย ใหม่ เก่า ใหญ่ เล็ก สูง ต่ำ เร็ว ช้า ดี งาน บ้าน เมือง โลก ชีวิต เวลา เรื่อง ทาง น้ำ ไฟ ลม ดิน ฟ้า รัก คิด รู้ เห็น พูด ฟัง เดิน นั่ง ยืน นอน กิน เล่น เรียน สอน อ่าน เขียน จำ ลืม หวัง ฝัน สร้าง ใช้ เปิด ปิด เริ่ม จบ พบ หา เจอ ช่วย ขอ บอก ถาม ตอบ ชอบ กลัว สุข เศร้า ยิ้ม หัวเราะ"
).split(" ");

EN_WORDS.push(
  ..."air light sound room story morning night family friend market street river mountain ocean forest window garden paper letter idea dream focus skill typing keyboard screen lesson practice steady simple clear sharp quick calm brave honest bright active modern local global travel health energy memory reason choice value result design create update review improve measure record target finish start select repeat correct mistake balance minute second future history culture science music art movie coffee tea food water city village office project message signal source browser button input output"
    .split(" "),
);

TH_WORDS.push(
  ..."วันนี้ เวลา บ้าน เมือง งาน เรียน อ่าน เขียน คิด ทำ เล่น เดิน นั่ง นอน กิน น้ำ ไฟ ลม ดิน ฟ้า รถ หนังสือ เพลง ตลาด ร้าน อาหาร กาแฟ ชา เงิน เพื่อน ครอบครัว เด็ก ผู้ใหญ่ โรงเรียน มหาวิทยาลัย คอมพิวเตอร์ โทรศัพท์ ภาษา ไทย อังกฤษ ข่าว สุขภาพ กีฬา ท่องเที่ยว ธรรมชาติ ภูเขา ทะเล แม่น้ำ ฝน แดด เช้า กลางวัน เย็น คืน ห้อง ถนน หน้าต่าง สวน กระดาษ จดหมาย ความคิด ความฝัน สมาธิ ทักษะ แป้นพิมพ์ หน้าจอ แบบฝึก ความเร็ว แม่นยำ เรียบง่าย ชัดเจน กล้าหาญ ซื่อสัตย์ สดใส ทันสมัย ท้องถิ่น สากล เดินทาง พลังงาน ความจำ เหตุผล ตัวเลือก คุณค่า ผลลัพธ์ ออกแบบ สร้าง อัปเดต ตรวจสอบ ปรับปรุง วัดผล บันทึก เป้าหมาย สำเร็จ เริ่มต้น เลือก ทำซ้ำ ถูกต้อง ผิดพลาด สมดุล นาที วินาที อนาคต ประวัติศาสตร์ วัฒนธรรม วิทยาศาสตร์ ดนตรี ศิลปะ ภาพยนตร์"
    .split(" "),
);

export const EN_QUOTES = [
  "the quick brown fox jumps over the lazy dog while the sun sets behind the quiet hills",
  "every keystroke is a small act of intention and the rhythm of your hands becomes a kind of music",
  "speed is the natural result of accuracy practiced patiently over a long stretch of ordinary days",
  "the best way to predict the future is to build it one careful line at a time without rushing",
];

export const TH_QUOTES = [
  "การฝึกพิมพ์ทุกวันคือการลงทุนเล็กๆ ที่ให้ผลตอบแทนมหาศาลในระยะยาวอย่างเงียบงัน",
  "ความเร็วเกิดจากความแม่นยำที่ฝึกฝนอย่างอดทนสม่ำเสมอไม่ใช่จากการรีบเร่ง",
  "นิ้วทุกนิ้วมีหน้าที่ของมันเมื่อเราเชื่อใจกล้ามเนื้อความเร็วจะตามมาเอง",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Build a space-joined string of `count` random words from the language bank. */
export function buildWords(lang: Lang, count: number): string {
  const bank = lang === "th" ? TH_WORDS : EN_WORDS;
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pick(bank));
  return out.join(" ");
}

/** Pick a random quote for the language (used as AI fallback / lesson flavor). */
export function pickQuote(lang: Lang): string {
  return pick(lang === "th" ? TH_QUOTES : EN_QUOTES);
}
