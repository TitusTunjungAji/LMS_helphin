export type Mentor = {
  id: string;
  name: string;
  prodi: string;
  fakultas: string;
  angkatan: number;
  course: string;
  price: number;
  sessions: number;
  rating: number;
  badge: "Perintis" | "Tepercaya" | "Pendamping";
  focus: string;
  methods: Array<"Daring" | "Tatap muka">;
  wash: string;
};

export const MENTORS: Mentor[] = [
  {
    id: "salsa",
    name: "Salsa Nabila",
    prodi: "Informatika",
    fakultas: "Fakultas Informatika",
    angkatan: 2022,
    course: "Algoritma",
    price: 20000,
    sessions: 31,
    rating: 5,
    badge: "Perintis",
    focus: "Alur algoritma dan rekursi",
    methods: ["Daring", "Tatap muka"],
    wash: "#E0F7FA",
  },
  {
    id: "aulia",
    name: "Aulia Rahman",
    prodi: "Informatika",
    fakultas: "Fakultas Informatika",
    angkatan: 2023,
    course: "Basis Data",
    price: 18000,
    sessions: 24,
    rating: 4.9,
    badge: "Tepercaya",
    focus: "Pemodelan data dan kueri",
    methods: ["Daring"],
    wash: "#E1F5FE",
  },
  {
    id: "dimas",
    name: "Dimas Pratama",
    prodi: "Informatika",
    fakultas: "Fakultas Informatika",
    angkatan: 2022,
    course: "Kalkulus",
    price: 15000,
    sessions: 11,
    rating: 4.8,
    badge: "Pendamping",
    focus: "Limit dan integral",
    methods: ["Tatap muka"],
    wash: "#FFF3E0",
  },
  {
    id: "farhan",
    name: "Farhan Yusuf",
    prodi: "Teknik Komputer",
    fakultas: "Fakultas Teknik Elektro",
    angkatan: 2023,
    course: "Jaringan",
    price: 12000,
    sessions: 9,
    rating: 4.7,
    badge: "Pendamping",
    focus: "Subnetting dan model jaringan",
    methods: ["Daring", "Tatap muka"],
    wash: "#FCE4EC",
  },
  {
    id: "keisha",
    name: "Keisha Amalia",
    prodi: "Sistem Informasi",
    fakultas: "Fakultas Rekayasa Industri",
    angkatan: 2024,
    course: "Statistika",
    price: 20000,
    sessions: 18,
    rating: 4.9,
    badge: "Tepercaya",
    focus: "Distribusi dan uji hipotesis",
    methods: ["Daring"],
    wash: "#F3E5F5",
  },
  {
    id: "bima",
    name: "Bima Aditya",
    prodi: "Informatika",
    fakultas: "Fakultas Informatika",
    angkatan: 2025,
    course: "Pemrograman Web",
    price: 10000,
    sessions: 7,
    rating: 4.6,
    badge: "Pendamping",
    focus: "Struktur dan tata letak halaman",
    methods: ["Tatap muka"],
    wash: "#E0F2F1",
  },
];

export const FACULTIES: { name: string; prodi: string[] }[] = [
  { name: "Fakultas Informatika", prodi: ["Informatika", "Teknologi Informasi", "Rekayasa Perangkat Lunak", "Sains Data"] },
  { name: "Fakultas Teknik Elektro", prodi: ["Teknik Elektro", "Teknik Telekomunikasi", "Teknik Komputer", "Teknik Biomedis"] },
  { name: "Fakultas Rekayasa Industri", prodi: ["Sistem Informasi", "Teknik Industri", "Teknik Logistik"] },
  { name: "Fakultas Komunikasi dan Bisnis", prodi: ["Ilmu Komunikasi", "Administrasi Bisnis"] },
  { name: "Fakultas Ilmu Terapan", prodi: ["Teknik Komputer (D3)", "Sistem Informasi (D3)"] },
  { name: "Fakultas Industri Kreatif", prodi: ["Desain Komunikasi Visual", "Desain Produk"] },
];

export const COHORTS = [2022, 2023, 2024, 2025, 2026];

export const LEVEL1_MAX = 20000;

export const TARIF_HINT =
  "Mentor level 1 dapat menetapkan tarif paling tinggi Rp20.000 per sesi, dalam kelipatan Rp1.000.";

export function parseTarif(raw: string): number | null {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  const price = Number(digits);
  if (!Number.isSafeInteger(price) || price < 1000 || price > LEVEL1_MAX || price % 1000 !== 0) return null;
  return price;
}

export function getMentor(id: string) {
  return MENTORS.find((mentor) => mentor.id === id);
}

export function rupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export const SESSION_KEY = "helphin-marketplace-session";

export type MentorProfile = {
  fakultas: string;
  prodi: string;
  angkatan: string;
  course: string;
  price: number;
  focus: string;
  nim: string;
};

export type MarketplaceSession = {
  name: string;
  email: string;
  nim: string;
  phone: string;
  fakultas: string;
  prodi: string;
  angkatan: string;
  bio: string;
  mentor: MentorProfile | null;
  verified: boolean;
  token: string;
  accountId: string;
};

export const DUMMY_SSO = {
  email: "bagas.sso@student.telkomuniversity.ac.id",
  name: "Bagas Pratama",
  nim: "103012300108",
  phone: "081234567890",
  fakultas: "Fakultas Informatika",
  prodi: "Informatika",
  angkatan: "2023",
};

export const REVIEW_KEY = "helphin-marketplace-review";

export type ReviewState = {
  name: string;
  email: string;
  nim: string;
  status: string;
  reviewNote: string;
};

const MENTOR_KEY = "helphin-mentor-by-email";

export function readSession(): MarketplaceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketplaceSession>;
    if (!parsed.email || !parsed.name) return null;
    return {
      name: parsed.name,
      email: parsed.email,
      nim: parsed.nim || "",
      phone: parsed.phone || "",
      fakultas: parsed.fakultas || "",
      prodi: parsed.prodi || "",
      angkatan: parsed.angkatan || "",
      bio: parsed.bio || "",
      mentor: parsed.mentor || lookupMentor(parsed.email),
      verified: parsed.verified === true && Boolean(parsed.token),
      token: parsed.token || "",
      accountId: parsed.accountId || "",
    };
  } catch {
    return null;
  }
}

function notifySession() {
  window.dispatchEvent(new Event("helphin-session"));
}

export function writeSession(session: MarketplaceSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  confirmedToken = session.verified ? session.token : "";
  if (session.mentor) {
    const all = readMentorBook();
    all[session.email.toLowerCase()] = session.mentor;
    localStorage.setItem(MENTOR_KEY, JSON.stringify(all));
  }
  notifySession();
}

function readMentorBook(): Record<string, MentorProfile> {
  try {
    return JSON.parse(localStorage.getItem(MENTOR_KEY) || "{}");
  } catch {
    return {};
  }
}

export function lookupMentor(email: string): MentorProfile | null {
  return readMentorBook()[email.toLowerCase()] || null;
}

let confirmedToken = "";

export function sessionFromAccount(
  account: {
    id: string;
    name: string;
    email: string;
    nim: string;
    phone: string;
    fakultas: string;
    prodi: string;
    angkatan: string;
    bio: string;
    status?: string;
    mentorCourse: string | null;
    mentorPrice: number | null;
    mentorFocus: string | null;
  },
  token: string,
): MarketplaceSession {
  const mentor = account.status === "disetujui" && account.mentorCourse && account.mentorPrice && account.mentorFocus
    ? {
        fakultas: account.fakultas,
        prodi: account.prodi,
        angkatan: account.angkatan,
        course: account.mentorCourse,
        price: account.mentorPrice,
        focus: account.mentorFocus,
        nim: account.nim,
      }
    : lookupMentor(account.email);
  return {
    name: account.name,
    email: account.email,
    nim: account.nim,
    phone: account.phone,
    fakultas: account.fakultas,
    prodi: account.prodi,
    angkatan: account.angkatan,
    bio: account.bio || "",
    mentor,
    verified: true,
    token,
    accountId: account.id,
  };
}

export async function confirmSession(): Promise<MarketplaceSession | null> {
  const current = readSession();
  if (!current?.verified || !current.token) return null;
  const response = await fetch("/api/marketplace/saya", {
    headers: { Authorization: `Bearer ${current.token}` },
  });
  if (!response.ok) {
    confirmedToken = "";
    clearSession();
    return null;
  }
  const body = await response.json();
  const next = sessionFromAccount(body.data, current.token);
  confirmedToken = next.token;
  writeSession(next);
  return next;
}

export function writeReviewState(state: ReviewState) {
  sessionStorage.setItem(REVIEW_KEY, JSON.stringify(state));
}

export function readReviewState(): ReviewState | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(REVIEW_KEY) || "");
    if (!parsed?.email || !parsed?.status) return null;
    return parsed as ReviewState;
  } catch {
    return null;
  }
}

export function clearSession() {
  confirmedToken = "";
  localStorage.removeItem(SESSION_KEY);
  notifySession();
}
