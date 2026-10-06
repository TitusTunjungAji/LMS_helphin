import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Hono } from "hono";
import { and, desc, eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import initSqlJs from "sql.js";
import { db, client } from "../db";
import { marketplaceAccounts, roles, users } from "../schema";
import { signJwt, verifyJwt } from "../jwt";
import { downloadFromFirebase, getFirebaseBucket } from "../firebase";
import { COHORTS, DUMMY_SSO, FACULTIES, LEVEL1_MAX } from "../../app/marketplace/data";

const marketplace = new Hono();
const PRIVATE_DIR = path.join(process.cwd(), "data", "marketplace-private");
const SQLITE_FILE = path.join(process.cwd(), "data", "marketplace.sqlite");
const LOCAL_STAFF_EMAIL = "kemahasiswaan@telkomuniversity.ac.id";
const LOCAL_STAFF_PASSWORD = "HelphinTinjau2026";
const STUDENT_EMAIL = /@student\.telkomuniversity\.ac\.id$/i;
const MAX_BYTES = 2 * 1024 * 1024;

type Account = typeof marketplaceAccounts.$inferSelect;
type TokenUser = { sub: string; role?: string; purpose?: string };

function useLocalDatabase() {
  const url = process.env.DATABASE_URL || "";
  return !url.startsWith("postgres://") && !url.startsWith("postgresql://");
}

let tableReady: Promise<void> | null = null;
let sqliteDb: import("sql.js").Database | null = null;

function ensureTable() {
  if (useLocalDatabase()) return ensureSqlite();
  if (!tableReady) {
    tableReady = client`
      CREATE TABLE IF NOT EXISTS marketplace_accounts (
        id uuid PRIMARY KEY,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL UNIQUE,
        nim varchar(50) NOT NULL UNIQUE,
        phone varchar(30) NOT NULL,
        password_hash varchar(255) NOT NULL,
        fakultas varchar(255) NOT NULL,
        prodi varchar(255) NOT NULL,
        angkatan varchar(10) NOT NULL,
        bio text,
        photo_path text NOT NULL,
        ktm_path text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'menunggu',
        review_note text,
        reviewed_at timestamp,
        mentor_course varchar(255),
        mentor_price integer,
        mentor_focus text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `.then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

async function ensureSqlite() {
  if (sqliteDb) return;
  const SQL = await initSqlJs();
  mkdirSync(path.dirname(SQLITE_FILE), { recursive: true });
  sqliteDb = existsSync(SQLITE_FILE)
    ? new SQL.Database(readFileSync(SQLITE_FILE))
    : new SQL.Database();
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS marketplace_accounts (
      id text PRIMARY KEY,
      user_id text,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      nim text NOT NULL UNIQUE,
      phone text NOT NULL,
      password_hash text NOT NULL,
      fakultas text NOT NULL,
      prodi text NOT NULL,
      angkatan text NOT NULL,
      bio text,
      photo_path text NOT NULL,
      ktm_path text NOT NULL,
      status text NOT NULL DEFAULT 'menunggu',
      review_note text,
      reviewed_at text,
      mentor_course text,
      mentor_price integer,
      mentor_focus text,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS marketplace_staff (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL
    );
  `);
  const existing = sqliteOne("SELECT id FROM marketplace_staff WHERE email = ?", [LOCAL_STAFF_EMAIL]);
  if (!existing) {
    sqliteDb.run(
      "INSERT INTO marketplace_staff (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [crypto.randomUUID(), "Kemahasiswaan", LOCAL_STAFF_EMAIL, await bcrypt.hash(LOCAL_STAFF_PASSWORD, 8), "admin"],
    );
  }
  saveSqlite();
}

function saveSqlite() {
  if (!sqliteDb) return;
  writeFileSync(SQLITE_FILE, Buffer.from(sqliteDb.export()));
}

function sqliteAll(sql: string, params: Array<string | number | null> = []) {
  if (!sqliteDb) return [];
  const statement = sqliteDb.prepare(sql);
  statement.bind(params);
  const rows: Record<string, string | number | null>[] = [];
  while (statement.step()) rows.push(statement.getAsObject() as Record<string, string | number | null>);
  statement.free();
  return rows.map(mapSqliteAccount);
}

function sqliteOne(sql: string, params: Array<string | number | null> = []) {
  return sqliteAll(sql, params)[0] || null;
}

function mapSqliteAccount(row: Record<string, string | number | null>): Account {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    name: String(row.name),
    email: String(row.email),
    nim: String(row.nim),
    phone: String(row.phone),
    passwordHash: String(row.password_hash),
    fakultas: String(row.fakultas),
    prodi: String(row.prodi),
    angkatan: String(row.angkatan),
    bio: row.bio ? String(row.bio) : null,
    photoPath: String(row.photo_path),
    ktmPath: String(row.ktm_path),
    status: String(row.status),
    reviewNote: row.review_note ? String(row.review_note) : null,
    reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)) : null,
    mentorCourse: row.mentor_course ? String(row.mentor_course) : null,
    mentorPrice: row.mentor_price == null ? null : Number(row.mentor_price),
    mentorFocus: row.mentor_focus ? String(row.mentor_focus) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

async function findAccount(emailOrNim: { email?: string; nim?: string; id?: string }) {
  await ensureTable();
  if (useLocalDatabase()) {
    if (emailOrNim.id) return sqliteOne("SELECT * FROM marketplace_accounts WHERE id = ?", [emailOrNim.id]);
    return sqliteOne("SELECT * FROM marketplace_accounts WHERE email = ? OR nim = ?", [emailOrNim.email || "", emailOrNim.nim || ""]);
  }
  const filters = [];
  if (emailOrNim.id) filters.push(eq(marketplaceAccounts.id, emailOrNim.id));
  if (emailOrNim.email) filters.push(eq(marketplaceAccounts.email, emailOrNim.email));
  if (emailOrNim.nim) filters.push(eq(marketplaceAccounts.nim, emailOrNim.nim));
  const [row] = await db.select().from(marketplaceAccounts).where(or(...filters)).limit(1);
  return row || null;
}

async function tokenOf(c: { req: { header: (name: string) => string | undefined } }): Promise<TokenUser | null> {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const payload = await verifyJwt(header.slice(7));
  if (!payload?.sub) return null;
  return payload as TokenUser;
}

function isReviewer(token: TokenUser | null) {
  return token?.purpose === "marketplace-review" && (token.role === "admin" || token.role === "super_admin");
}

async function storeFile(id: string, kind: "foto" | "ktm", file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Foto profil dan KTM harus berupa JPG, PNG, atau WEBP.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Ukuran setiap berkas paling besar 2 MB.");
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${id}-${kind}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!useLocalDatabase()) {
    try {
      const bucket = getFirebaseBucket();
      const objectPath = `marketplace-verifikasi/${filename}`;
      await bucket.file(objectPath).save(buffer, { metadata: { contentType: file.type } });
      return `fb:${objectPath}`;
    } catch {
      // Berkas tetap disimpan di server bila Firebase belum siap.
    }
  }
  await mkdir(PRIVATE_DIR, { recursive: true });
  await writeFile(path.join(PRIVATE_DIR, filename), buffer);
  return `local:${filename}`;
}

async function readStored(stored: string) {
  if (stored.startsWith("fb:")) return downloadFromFirebase(stored.slice(3));
  if (stored.startsWith("local:")) return readFile(path.join(PRIVATE_DIR, path.basename(stored.slice(6))));
  throw new Error("Berkas tidak ditemukan.");
}

function mimeOf(stored: string) {
  if (stored.endsWith(".png")) return "image/png";
  if (stored.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function publicAccount(row: Account) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    nim: row.nim,
    phone: row.phone,
    fakultas: row.fakultas,
    prodi: row.prodi,
    angkatan: row.angkatan,
    bio: row.bio || "",
    status: row.status,
    reviewNote: row.reviewNote || "",
    mentorCourse: row.mentorCourse,
    mentorPrice: row.mentorPrice,
    mentorFocus: row.mentorFocus,
    createdAt: row.createdAt,
  };
}

marketplace.get("/mode", (c) => c.json({
  success: true,
  data: useLocalDatabase()
    ? { storage: "local", staffEmail: LOCAL_STAFF_EMAIL }
    : { storage: "server" },
}));

marketplace.post("/akun", async (c) => {
  await ensureTable();
  const form = await c.req.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const nim = String(form.get("nim") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const password = String(form.get("password") || "");
  const fakultas = String(form.get("fakultas") || "");
  const prodi = String(form.get("prodi") || "");
  const angkatan = String(form.get("angkatan") || "");
  const photo = form.get("photo");
  const ktm = form.get("ktm");

  if (name.length < 3) return c.json({ success: false, message: "Nama lengkap wajib diisi." }, 400);
  if (!STUDENT_EMAIL.test(email)) {
    return c.json({ success: false, message: "Gunakan email mahasiswa @student.telkomuniversity.ac.id." }, 400);
  }
  if (!/^\d{8,14}$/.test(nim)) return c.json({ success: false, message: "NIM harus berupa angka pada kartu mahasiswa." }, 400);
  if (phone.length < 8) return c.json({ success: false, message: "Nomor telepon wajib diisi." }, 400);
  if (password.length < 8) return c.json({ success: false, message: "Kata sandi minimal 8 karakter." }, 400);
  const faculty = FACULTIES.find((item) => item.name === fakultas);
  if (!faculty || !faculty.prodi.includes(prodi)) {
    return c.json({ success: false, message: "Fakultas dan program studi tidak sesuai." }, 400);
  }
  if (!COHORTS.map(String).includes(angkatan)) {
    return c.json({ success: false, message: "Angkatan marketplace dimulai dari 2022." }, 400);
  }
  if (!(photo instanceof File) || !(ktm instanceof File)) {
    return c.json({ success: false, message: "Unggah foto profil dan foto KTM." }, 400);
  }

  const existing = await findAccount({ email, nim });
  if (existing?.status === "disetujui") return c.json({ success: false, message: "Akun ini sudah disetujui. Silakan masuk." }, 409);
  if (existing?.status === "menunggu") return c.json({ success: false, message: "Pengajuan ini masih menunggu tinjauan kemahasiswaan." }, 409);

  const id = existing?.id || crypto.randomUUID();
  let photoPath = "";
  let ktmPath = "";
  try {
    photoPath = await storeFile(id, "foto", photo);
    ktmPath = await storeFile(id, "ktm", ktm);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Berkas tidak dapat disimpan.";
    return c.json({ success: false, message }, 400);
  }
  const passwordHash = await bcrypt.hash(password, 8);
  const now = new Date().toISOString();
  if (useLocalDatabase()) {
    if (existing) {
      sqliteDb?.run(
        `UPDATE marketplace_accounts SET name=?, email=?, nim=?, phone=?, password_hash=?, fakultas=?, prodi=?, angkatan=?, photo_path=?, ktm_path=?, status='menunggu', review_note=NULL, reviewed_at=NULL, updated_at=? WHERE id=?`,
        [name, email, nim, phone, passwordHash, fakultas, prodi, angkatan, photoPath, ktmPath, now, id],
      );
    } else {
      sqliteDb?.run(
        `INSERT INTO marketplace_accounts (id, name, email, nim, phone, password_hash, fakultas, prodi, angkatan, photo_path, ktm_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?, ?)`,
        [id, name, email, nim, phone, passwordHash, fakultas, prodi, angkatan, photoPath, ktmPath, now, now],
      );
    }
    saveSqlite();
  } else if (existing) {
    await db.update(marketplaceAccounts).set({
      name, email, nim, phone, passwordHash, fakultas, prodi, angkatan, photoPath, ktmPath,
      status: "menunggu", reviewNote: null, reviewedAt: null, updatedAt: new Date(),
    }).where(eq(marketplaceAccounts.id, id));
  } else {
    await db.insert(marketplaceAccounts).values({
      id, name, email, nim, phone, passwordHash, fakultas, prodi, angkatan, photoPath, ktmPath, status: "menunggu",
    });
  }
  return c.json({
    success: true,
    message: "Pengajuan tersimpan dan menunggu tinjauan kemahasiswaan.",
    data: { name, email, nim, status: "menunggu", reviewNote: "" },
  }, 201);
});

marketplace.post("/masuk", async (c) => {
  await ensureTable();
  const body = await c.req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const row = await findAccount({ email });
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
    const staff = useLocalDatabase() ? sqliteAllStaff(email)[0] : null;
    if (staff && await bcrypt.compare(password, staff.passwordHash)) {
      const token = await signJwt({ sub: staff.id, role: staff.role, purpose: "marketplace-review", exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 });
      return c.json({ success: true, data: { role: "petugas", name: staff.name, token } });
    }
    if (staff) return c.json({ success: false, message: "Kata sandi petugas tidak sesuai." }, 401);
    return c.json({ success: false, message: "Email belum terdaftar atau kata sandi tidak sesuai." }, 401);
  }
  if (row.status !== "disetujui") {
    return c.json({ success: true, data: { status: row.status, reviewNote: row.reviewNote || "", name: row.name, email: row.email, nim: row.nim } });
  }
  const token = await signJwt({ sub: row.id, role: "marketplace", purpose: "marketplace", exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 });
  return c.json({ success: true, data: { ...publicAccount(row), token } });
});

marketplace.get("/saya", async (c) => {
  const token = await tokenOf(c);
  if (token?.purpose !== "marketplace") return c.json({ success: false, message: "Unauthorized" }, 401);
  const row = await findAccount({ id: token.sub });
  if (!row) return c.json({ success: false, message: "Akun tidak ditemukan." }, 401);
  return c.json({ success: true, data: publicAccount(row) });
});

marketplace.post("/sso", async (c) => {
  await ensureTable();
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || DUMMY_SSO.email).trim().toLowerCase();
  if (email !== DUMMY_SSO.email) {
    return c.json({ success: false, message: "SSO Telkom belum aktif. Gunakan akun dummy yang disediakan." }, 400);
  }
  let row = await findAccount({ email });
  if (!row) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash("sso-dummy", 8);
    if (useLocalDatabase()) {
      sqliteDb?.run(
        `INSERT INTO marketplace_accounts (id, name, email, nim, phone, password_hash, fakultas, prodi, angkatan, photo_path, ktm_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sso:none', 'sso:none', 'pengguna', ?, ?)`,
        [id, DUMMY_SSO.name, DUMMY_SSO.email, DUMMY_SSO.nim, DUMMY_SSO.phone, passwordHash, DUMMY_SSO.fakultas, DUMMY_SSO.prodi, DUMMY_SSO.angkatan, now, now],
      );
      saveSqlite();
    } else {
      await db.insert(marketplaceAccounts).values({
        id,
        name: DUMMY_SSO.name,
        email: DUMMY_SSO.email,
        nim: DUMMY_SSO.nim,
        phone: DUMMY_SSO.phone,
        passwordHash,
        fakultas: DUMMY_SSO.fakultas,
        prodi: DUMMY_SSO.prodi,
        angkatan: DUMMY_SSO.angkatan,
        photoPath: "sso:none",
        ktmPath: "sso:none",
        status: "pengguna",
      });
    }
    row = await findAccount({ email });
  }
  if (!row) return c.json({ success: false, message: "Akun SSO dummy gagal dibuat." }, 500);
  const token = await signJwt({ sub: row.id, role: "marketplace", purpose: "marketplace", exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 });
  return c.json({ success: true, data: { ...publicAccount(row), token } });
});

marketplace.post("/mentor", async (c) => {
  const token = await tokenOf(c);
  if (token?.purpose !== "marketplace") return c.json({ success: false, message: "Masuk terlebih dahulu." }, 401);
  const form = await c.req.formData();
  const course = String(form.get("course") || "").trim();
  const focus = String(form.get("focus") || "").trim();
  const price = Number(String(form.get("price") || "").replace(/\D/g, ""));
  const fakultas = String(form.get("fakultas") || "");
  const prodi = String(form.get("prodi") || "");
  const angkatan = String(form.get("angkatan") || "");
  const photo = form.get("photo");
  const ktm = form.get("ktm");
  if (!course || !focus || !Number.isInteger(price) || price < 1000 || price > LEVEL1_MAX || price % 1000 !== 0) {
    return c.json({ success: false, message: "Mentor level 1 dapat menetapkan tarif paling tinggi Rp100.000, kelipatan Rp1.000." }, 400);
  }
  const faculty = FACULTIES.find((item) => item.name === fakultas);
  if (!faculty || !faculty.prodi.includes(prodi) || !COHORTS.map(String).includes(angkatan)) {
    return c.json({ success: false, message: "Fakultas, program studi, atau angkatan tidak sesuai." }, 400);
  }
  if (!(photo instanceof File) || !(ktm instanceof File)) {
    return c.json({ success: false, message: "Unggah foto profil dan foto KTM untuk ditinjau kemahasiswaan." }, 400);
  }
  const row = await findAccount({ id: token.sub });
  if (!row) return c.json({ success: false, message: "Akun tidak ditemukan." }, 404);
  if (row.status === "menunggu") return c.json({ success: false, message: "Pengajuan mentor masih menunggu tinjauan kemahasiswaan." }, 409);
  if (row.status === "disetujui") return c.json({ success: false, message: "Akun ini sudah menjadi mentor." }, 409);
  let photoPath = "";
  let ktmPath = "";
  try {
    photoPath = await storeFile(row.id, "foto", photo);
    ktmPath = await storeFile(row.id, "ktm", ktm);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Berkas tidak dapat disimpan.";
    return c.json({ success: false, message }, 400);
  }
  const now = new Date();
  if (useLocalDatabase()) {
    sqliteDb?.run(
      "UPDATE marketplace_accounts SET fakultas=?, prodi=?, angkatan=?, mentor_course=?, mentor_price=?, mentor_focus=?, photo_path=?, ktm_path=?, status='menunggu', review_note=NULL, reviewed_at=NULL, updated_at=? WHERE id=?",
      [fakultas, prodi, angkatan, course, price, focus, photoPath, ktmPath, now.toISOString(), row.id],
    );
    saveSqlite();
  } else {
    await db.update(marketplaceAccounts).set({
      fakultas, prodi, angkatan, mentorCourse: course, mentorPrice: price, mentorFocus: focus,
      photoPath, ktmPath, status: "menunggu", reviewNote: null, reviewedAt: null, updatedAt: now,
    }).where(eq(marketplaceAccounts.id, row.id));
  }
  return c.json({
    success: true,
    data: { name: row.name, email: row.email, nim: row.nim, status: "menunggu", reviewNote: "" },
  });
});

marketplace.post("/tinjauan/masuk", async (c) => {
  await ensureTable();
  const body = await c.req.json();
  const identity = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (useLocalDatabase()) {
    const staffRows = sqliteDb ? sqliteAllStaff(identity) : [];
    const staff = staffRows[0];
    if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
      return c.json({ success: false, message: "Akun petugas tidak dikenali." }, 401);
    }
    const token = await signJwt({ sub: staff.id, role: staff.role, purpose: "marketplace-review", exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 });
    return c.json({ success: true, data: { name: staff.name, token } });
  }
  const [user] = await db.select({
    id: users.id, name: users.name, email: users.email, passwordHash: users.passwordHash, role: roles.code,
  }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).where(or(eq(users.email, identity), eq(users.nim, identity))).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return c.json({ success: false, message: "Akun petugas tidak dikenali." }, 401);
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return c.json({ success: false, message: "Hanya petugas kemahasiswaan yang dapat meninjau pengajuan." }, 403);
  }
  const token = await signJwt({ sub: user.id, role: user.role, purpose: "marketplace-review", exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 });
  return c.json({ success: true, data: { name: user.name, token } });
});

function sqliteAllStaff(email: string) {
  if (!sqliteDb) return [];
  const statement = sqliteDb.prepare("SELECT * FROM marketplace_staff WHERE email = ?");
  statement.bind([email]);
  const rows: { id: string; name: string; passwordHash: string; role: string }[] = [];
  while (statement.step()) {
    const row = statement.getAsObject() as Record<string, string>;
    rows.push({ id: row.id, name: row.name, passwordHash: row.password_hash, role: row.role });
  }
  statement.free();
  return rows;
}

marketplace.get("/tinjauan", async (c) => {
  await ensureTable();
  if (!isReviewer(await tokenOf(c))) return c.json({ success: false, message: "Unauthorized" }, 401);
  const status = c.req.query("status") || "menunggu";
  const rows = useLocalDatabase()
    ? sqliteAll("SELECT * FROM marketplace_accounts WHERE status = ? ORDER BY created_at DESC", [status])
    : await db.select().from(marketplaceAccounts).where(eq(marketplaceAccounts.status, status)).orderBy(desc(marketplaceAccounts.createdAt));
  return c.json({ success: true, data: rows.map(publicAccount) });
});

marketplace.post("/tinjauan/:id", async (c) => {
  await ensureTable();
  const reviewer = await tokenOf(c);
  if (!isReviewer(reviewer)) return c.json({ success: false, message: "Unauthorized" }, 401);
  const body = await c.req.json();
  const keputusan = body.keputusan === "disetujui" ? "disetujui" : body.keputusan === "ditolak" ? "ditolak" : "";
  const catatan = String(body.catatan || "").trim();
  if (!keputusan) return c.json({ success: false, message: "Keputusan tidak dikenal." }, 400);
  if (keputusan === "ditolak" && catatan.length < 5) return c.json({ success: false, message: "Tuliskan alasan penolakan." }, 400);
  const row = await findAccount({ id: c.req.param("id") });
  if (!row) return c.json({ success: false, message: "Pengajuan tidak ditemukan." }, 404);

  let userId = row.userId;
  if (keputusan === "disetujui" && !useLocalDatabase()) {
    const [studentRole] = await db.select().from(roles).where(eq(roles.code, "student")).limit(1);
    const [existing] = await db.select({ id: users.id }).from(users).where(or(eq(users.email, row.email), eq(users.nim, row.nim))).limit(1);
    if (existing) userId = existing.id;
    else {
      const [created] = await db.insert(users).values({
        name: row.name, email: row.email, nim: row.nim, passwordHash: row.passwordHash, roleId: studentRole?.id || null,
      }).returning({ id: users.id });
      userId = created.id;
    }
  }
  if (keputusan === "disetujui" && useLocalDatabase()) userId = row.id;
  const now = new Date();
  if (useLocalDatabase()) {
    sqliteDb?.run(
      "UPDATE marketplace_accounts SET status=?, review_note=?, reviewed_at=?, user_id=?, updated_at=? WHERE id=?",
      [keputusan, catatan || null, now.toISOString(), userId, now.toISOString(), row.id],
    );
    saveSqlite();
  } else {
    await db.update(marketplaceAccounts).set({
      status: keputusan, reviewNote: catatan || null, reviewedAt: now, userId, updatedAt: now,
    }).where(and(eq(marketplaceAccounts.id, row.id)));
  }
  const updated = await findAccount({ id: row.id });
  return c.json({ success: true, data: publicAccount(updated!) });
});

marketplace.get("/berkas/:id/:jenis", async (c) => {
  await ensureTable();
  const token = await tokenOf(c);
  const id = c.req.param("id");
  const jenis = c.req.param("jenis");
  if (jenis !== "foto" && jenis !== "ktm") return c.json({ success: false, message: "Berkas tidak dikenal." }, 404);
  if (!(isReviewer(token) || (token?.purpose === "marketplace" && token.sub === id))) {
    return c.json({ success: false, message: "Unauthorized" }, 401);
  }
  const row = await findAccount({ id });
  if (!row) return c.json({ success: false, message: "Pengajuan tidak ditemukan." }, 404);
  const stored = jenis === "foto" ? row.photoPath : row.ktmPath;
  const bytes = await readStored(stored);
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": mimeOf(stored), "Cache-Control": "private, max-age=60" } });
});

export default marketplace;
