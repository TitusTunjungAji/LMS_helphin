export type DeskMessage = {
  id: string;
  from: "student" | "mentor";
  text: string;
  at: number;
};

export type DeskThread = {
  id: string;
  name: string;
  prodi: string;
  angkatan: number;
  course: string;
  readAt: number;
  messages: DeskMessage[];
};

const KEY = "helphin-mentor-inbox";

function seed(): DeskThread[] {
  const now = Date.now();
  return [
    {
      id: "nadia",
      name: "Nadia Putri",
      prodi: "Informatika",
      angkatan: 2024,
      course: "Basis Data",
      readAt: 0,
      messages: [
        { id: "n1", from: "student", text: "Selamat sore, Kak. Saya ingin mendalami normalisasi sebelum responsi.", at: now - 1000 * 60 * 50 },
        { id: "n2", from: "mentor", text: "Silakan sebutkan bagian yang masih sulit, supaya latihannya lebih terarah.", at: now - 1000 * 60 * 36 },
        { id: "n3", from: "student", text: "Bentuk normal ketiga masih sering tertukar dengan bentuk normal kedua.", at: now - 1000 * 60 * 8 },
      ],
    },
    {
      id: "reza",
      name: "Reza Akbar",
      prodi: "Informatika",
      angkatan: 2023,
      course: "Basis Data",
      readAt: 0,
      messages: [
        { id: "r1", from: "student", text: "Kak, apakah Kamis pukul 16.00 masih tersedia untuk sesi daring?", at: now - 1000 * 60 * 18 },
      ],
    },
    {
      id: "intan",
      name: "Intan Maharani",
      prodi: "Sistem Informasi",
      angkatan: 2024,
      course: "Statistika",
      readAt: now - 1000 * 60 * 20,
      messages: [
        { id: "i1", from: "student", text: "Saya perlu latihan uji hipotesis untuk kuis minggu depan.", at: now - 1000 * 60 * 26 },
        { id: "i2", from: "mentor", text: "Bisa. Kirimkan soal yang ingin dibahas, lalu kita tetapkan waktunya.", at: now - 1000 * 60 * 21 },
      ],
    },
    {
      id: "galih",
      name: "Galih Saputra",
      prodi: "Teknik Komputer",
      angkatan: 2025,
      course: "Jaringan Komputer",
      readAt: 0,
      messages: [
        { id: "g1", from: "student", text: "Mohon bantuan subnetting untuk tugas kelompok, Kak.", at: now - 1000 * 60 * 64 },
      ],
    },
  ];
}

export function readInbox(): DeskThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seed();
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DeskThread[];
    return Array.isArray(parsed) ? parsed : seed();
  } catch {
    return seed();
  }
}

function save(threads: DeskThread[]) {
  localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("helphin-inbox"));
}

export function unreadCount(thread: DeskThread) {
  return thread.messages.filter((message) => message.from === "student" && message.at > thread.readAt).length;
}

export function markInboxRead(threadId: string) {
  const threads = readInbox().map((thread) => (thread.id === threadId ? { ...thread, readAt: Date.now() } : thread));
  save(threads);
  return threads;
}

export function replyInbox(threadId: string, text: string) {
  const clean = text.trim();
  if (!clean) return readInbox();
  const threads = readInbox().map((thread) => {
    if (thread.id !== threadId) return thread;
    return {
      ...thread,
      readAt: Date.now(),
      messages: [...thread.messages, { id: crypto.randomUUID(), from: "mentor" as const, text: clean, at: Date.now() }],
    };
  });
  save(threads);
  const sentId = threads.find((thread) => thread.id === threadId)?.messages.at(-1)?.id;
  window.setTimeout(() => {
    const next = readInbox().map((thread) => {
      if (thread.id !== threadId || thread.messages.at(-1)?.id !== sentId) return thread;
      return {
        ...thread,
        messages: [
          ...thread.messages,
          {
            id: crypto.randomUUID(),
            from: "student" as const,
            text: "Baik, Kak. Saya sesuaikan dengan arahan tersebut.",
            at: Date.now(),
          },
        ],
      };
    });
    save(next);
  }, 800);
  return threads;
}

export const TRENDING = [
  { course: "Basis Data", asks: 18, note: "Normalisasi dan penyusunan kueri" },
  { course: "Algoritma", asks: 14, note: "Rekursi dan kompleksitas" },
  { course: "Statistika", asks: 11, note: "Distribusi dan uji hipotesis" },
  { course: "Jaringan Komputer", asks: 9, note: "Subnetting dan model jaringan" },
  { course: "Kalkulus", asks: 7, note: "Limit dan integral" },
];

export const UPCOMING = [
  { who: "Reza Akbar", when: "Kamis, 16.00", method: "Daring", topic: "Kueri relasional" },
  { who: "Nadia Putri", when: "Jumat, 19.00", method: "Daring", topic: "Bentuk normal" },
];
