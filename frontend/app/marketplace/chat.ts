import { getMentor } from "./data";

export type ChatMessage = {
  id: string;
  from: "me" | "mentor";
  text: string;
  at: number;
};

const KEY = "helphin-marketplace-chats";

export function readChats(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function save(chats: Record<string, ChatMessage[]>) {
  localStorage.setItem(KEY, JSON.stringify(chats));
  window.dispatchEvent(new Event("helphin-chats"));
}

export function threadOf(mentorId: string) {
  return readChats()[mentorId] || [];
}

export function contactedMentorIds() {
  return Object.entries(readChats())
    .filter(([, messages]) => messages.length > 0)
    .sort((a, b) => (b[1].at(-1)?.at || 0) - (a[1].at(-1)?.at || 0))
    .map(([id]) => id);
}

function replyFor(mentorId: string, text: string) {
  const mentor = getMentor(mentorId);
  const topic = mentor?.course || "mata kuliah ini";
  if (text.length < 24) {
    return `Baik. Bisa dijelaskan lebih rinci bagian ${topic} yang ingin didampingi?`;
  }
  return `Saya dapat mendampingi topik tersebut. Kita lanjutkan secara daring atau tatap muka di lingkungan kampus, sesuai kesepakatan.`;
}

export function sendChat(mentorId: string, text: string) {
  const clean = text.trim();
  if (!clean) return threadOf(mentorId);
  const chats = readChats();
  const thread = chats[mentorId] || [];
  const mine: ChatMessage = { id: crypto.randomUUID(), from: "me", text: clean, at: Date.now() };
  chats[mentorId] = [...thread, mine];
  save(chats);
  window.setTimeout(() => {
    const next = readChats();
    const current = next[mentorId] || [];
    if (current.at(-1)?.id !== mine.id) return;
    next[mentorId] = [
      ...current,
      { id: crypto.randomUUID(), from: "mentor", text: replyFor(mentorId, clean), at: Date.now() },
    ];
    save(next);
  }, 700);
  return chats[mentorId];
}
