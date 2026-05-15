import { Hono } from "hono";
import { db } from "../db";
import { materials, mataKuliah, prodi, bankSoal, users } from "../schema";
import { eq, and, ilike } from "drizzle-orm";
import { getAuthUser, requirePermission, requireProdiAccessOrAdmin } from "../auth";
import { logActivity } from "../logger";
import { cache, CACHE_TTL } from "../cache";
import { uploadToFirebase, deleteFromFirebase, downloadFromFirebase } from "../firebase";

// ===================== MATERIALS =====================
export const materialRoutes = new Hono();

materialRoutes.get("/", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("materi:view")(user);
    let conditions: any[] = [];
    const { mataKuliahId, tahunAjaran, search, prodiId: qProdiId } = c.req.query();
    if (!user!.permissions.includes("*") && user!.role !== "student") conditions.push(eq(materials.prodiId, user!.prodiId!));
    else if (qProdiId) conditions.push(eq(materials.prodiId, qProdiId));
    if (mataKuliahId) conditions.push(eq(materials.mataKuliahId, mataKuliahId));
    if (tahunAjaran) conditions.push(eq(materials.tahunAjaran, tahunAjaran));
    if (search) conditions.push(ilike(materials.title, `%${search}%`));

    const result = await db.select({ id: materials.id, title: materials.title, description: materials.description, fileUrl: materials.fileUrl, fileType: materials.fileType, tahunAjaran: materials.tahunAjaran, mataKuliahId: materials.mataKuliahId, mataKuliahName: mataKuliah.name, prodiId: materials.prodiId, prodiName: prodi.name, uploadedBy: materials.uploadedBy, createdAt: materials.createdAt })
        .from(materials).leftJoin(mataKuliah, eq(materials.mataKuliahId, mataKuliah.id)).leftJoin(prodi, eq(materials.prodiId, prodi.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(materials.createdAt);
    return c.json({ success: true, data: result });
});

materialRoutes.get("/:id", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);
    const [m] = await db.select({ id: materials.id, title: materials.title, description: materials.description, fileUrl: materials.fileUrl, fileType: materials.fileType, tahunAjaran: materials.tahunAjaran, mataKuliahId: materials.mataKuliahId, mataKuliahName: mataKuliah.name, prodiId: materials.prodiId, prodiName: prodi.name, uploadedBy: materials.uploadedBy, createdAt: materials.createdAt })
        .from(materials).leftJoin(mataKuliah, eq(materials.mataKuliahId, mataKuliah.id)).leftJoin(prodi, eq(materials.prodiId, prodi.id))
        .where(eq(materials.id, c.req.param("id"))).limit(1);
    if (!m) return c.json({ success: false, message: "Material not found" }, 404);
    return c.json({ success: true, data: m });
});

materialRoutes.post("/", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("materi:manage")(user);
    const formData = await c.req.formData();
    const prodiId = (formData.get("prodiId") as string) || user!.prodiId!;
    if (!requireProdiAccessOrAdmin(prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const file = formData.get("file") as File;
    if (!file) return c.json({ success: false, message: "File is required" }, 400);

    const fileName = `materials/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadToFirebase(buffer, fileName, file.type);
    const fileType = file.name.split(".").pop() || "unknown";

    const [created] = await db.insert(materials).values({ title: formData.get("title") as string, description: (formData.get("description") as string) || null, fileUrl, fileType, tahunAjaran: formData.get("tahunAjaran") as string, mataKuliahId: formData.get("mataKuliahId") as string, prodiId, uploadedBy: user!.id }).returning();
    await logActivity(user!.id, "upload_material", "material", created.id);
    cache.invalidate("materials"); cache.invalidate("matkul");
    return c.json({ success: true, message: "Material uploaded", data: created }, 201);
});

materialRoutes.patch("/:id", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("materi:manage")(user);
    const body = await c.req.json();
    const [existing] = await db.select().from(materials).where(eq(materials.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Material not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const updateData: any = { updatedAt: new Date() };
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tahunAjaran) updateData.tahunAjaran = body.tahunAjaran;
    if (body.mataKuliahId) updateData.mataKuliahId = body.mataKuliahId;
    const [updated] = await db.update(materials).set(updateData).where(eq(materials.id, c.req.param("id"))).returning();
    await logActivity(user!.id, "update_material", "material", c.req.param("id"));
    cache.invalidate("materials");
    return c.json({ success: true, data: updated });
});

materialRoutes.delete("/:id", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("materi:manage")(user);
    const [existing] = await db.select().from(materials).where(eq(materials.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Material not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);

    // Delete from Firebase Storage
    if (existing.fileUrl.includes("storage.googleapis.com")) {
        const fbPath = existing.fileUrl.split("/").slice(4).join("/");
        await deleteFromFirebase(fbPath);
    }

    await db.delete(materials).where(eq(materials.id, c.req.param("id")));
    await logActivity(user!.id, "delete_material", "material", c.req.param("id"));
    cache.invalidate("materials"); cache.invalidate("matkul");
    return c.json({ success: true, message: "Material deleted" });
});

materialRoutes.get("/:id/download", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);
    const [m] = await db.select().from(materials).where(eq(materials.id, c.req.param("id"))).limit(1);
    if (!m) return c.json({ success: false, message: "Material not found" }, 404);
    await logActivity(user.id, "download_material", "material", c.req.param("id"));

    // If Firebase URL, redirect to it
    if (m.fileUrl.startsWith("http")) {
        return c.redirect(m.fileUrl);
    }

    // Legacy: try to download from Firebase path
    try {
        const fbPath = m.fileUrl.replace("/uploads/", "materials/");
        const buffer = await downloadFromFirebase(fbPath);
        return new Response(new Uint8Array(buffer), { headers: { "Content-Disposition": `attachment; filename="${m.fileUrl.split("/").pop()}"` } });
    } catch {
        return c.json({ success: false, message: "File not found" }, 404);
    }
});

// ===================== BANK SOAL =====================
export const bankSoalRoutes = new Hono();

bankSoalRoutes.get("/", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("bank_soal:view")(user);
    let conditions: any[] = [];
    const { mataKuliahId, tahunAjaran, search, prodiId: qProdiId } = c.req.query();
    if (!user!.permissions.includes("*") && user!.role !== "student") conditions.push(eq(bankSoal.prodiId, user!.prodiId!));
    else if (qProdiId) conditions.push(eq(bankSoal.prodiId, qProdiId));
    if (mataKuliahId) conditions.push(eq(bankSoal.mataKuliahId, mataKuliahId));
    if (tahunAjaran) conditions.push(eq(bankSoal.tahunAjaran, tahunAjaran));
    if (search) conditions.push(ilike(bankSoal.title, `%${search}%`));
    const result = await db.select({ id: bankSoal.id, title: bankSoal.title, description: bankSoal.description, fileUrl: bankSoal.fileUrl, fileType: bankSoal.fileType, tahunAjaran: bankSoal.tahunAjaran, mataKuliahId: bankSoal.mataKuliahId, mataKuliahName: mataKuliah.name, prodiId: bankSoal.prodiId, prodiName: prodi.name, uploadedBy: bankSoal.uploadedBy, createdAt: bankSoal.createdAt })
        .from(bankSoal).leftJoin(mataKuliah, eq(bankSoal.mataKuliahId, mataKuliah.id)).leftJoin(prodi, eq(bankSoal.prodiId, prodi.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(bankSoal.createdAt);
    return c.json({ success: true, data: result });
});

bankSoalRoutes.get("/:id", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);
    const [m] = await db.select({ id: bankSoal.id, title: bankSoal.title, description: bankSoal.description, fileUrl: bankSoal.fileUrl, fileType: bankSoal.fileType, tahunAjaran: bankSoal.tahunAjaran, mataKuliahId: bankSoal.mataKuliahId, mataKuliahName: mataKuliah.name, prodiId: bankSoal.prodiId, prodiName: prodi.name, uploaderName: users.name, uploadedBy: bankSoal.uploadedBy, createdAt: bankSoal.createdAt })
        .from(bankSoal).leftJoin(mataKuliah, eq(bankSoal.mataKuliahId, mataKuliah.id)).leftJoin(prodi, eq(bankSoal.prodiId, prodi.id)).leftJoin(users, eq(bankSoal.uploadedBy, users.id))
        .where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!m) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    return c.json({ success: true, data: m });
});

bankSoalRoutes.post("/", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("bank_soal:manage")(user);
    const formData = await c.req.formData();
    const prodiId = (formData.get("prodiId") as string) || user!.prodiId!;
    if (!requireProdiAccessOrAdmin(prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const file = formData.get("file") as File;
    if (!file) return c.json({ success: false, message: "File is required" }, 400);

    const fileName = `bank-soal/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadToFirebase(buffer, fileName, file.type);
    const fileType = file.name.split(".").pop() || "unknown";

    const [created] = await db.insert(bankSoal).values({ title: formData.get("title") as string, description: (formData.get("description") as string) || null, fileUrl, fileType, tahunAjaran: formData.get("tahunAjaran") as string, mataKuliahId: formData.get("mataKuliahId") as string, prodiId, uploadedBy: user!.id }).returning();
    await logActivity(user!.id, "upload_bank_soal", "bank_soal", created.id);
    return c.json({ success: true, message: "Bank Soal uploaded", data: created }, 201);
});

bankSoalRoutes.patch("/:id", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("bank_soal:manage")(user);
    const body = await c.req.json();
    const [existing] = await db.select().from(bankSoal).where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const updateData: any = { updatedAt: new Date() };
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tahunAjaran) updateData.tahunAjaran = body.tahunAjaran;
    if (body.mataKuliahId) updateData.mataKuliahId = body.mataKuliahId;
    const [updated] = await db.update(bankSoal).set(updateData).where(eq(bankSoal.id, c.req.param("id"))).returning();
    await logActivity(user!.id, "update_bank_soal", "bank_soal", c.req.param("id"));
    return c.json({ success: true, data: updated });
});

bankSoalRoutes.delete("/:id", async (c) => {
    const user = await getAuthUser(c);
    requirePermission("bank_soal:manage")(user);
    const [existing] = await db.select().from(bankSoal).where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);

    if (existing.fileUrl.includes("storage.googleapis.com")) {
        const fbPath = existing.fileUrl.split("/").slice(4).join("/");
        await deleteFromFirebase(fbPath);
    }

    await db.delete(bankSoal).where(eq(bankSoal.id, c.req.param("id")));
    await logActivity(user!.id, "delete_bank_soal", "bank_soal", c.req.param("id"));
    return c.json({ success: true, message: "Bank Soal deleted" });
});

bankSoalRoutes.get("/:id/download", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);
    const [m] = await db.select().from(bankSoal).where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!m) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    await logActivity(user.id, "download_bank_soal", "bank_soal", c.req.param("id"));

    if (m.fileUrl.startsWith("http")) {
        return c.redirect(m.fileUrl);
    }

    try {
        const fbPath = m.fileUrl.replace("/uploads/bank-soal/", "bank-soal/");
        const buffer = await downloadFromFirebase(fbPath);
        return new Response(new Uint8Array(buffer), { headers: { "Content-Disposition": `attachment; filename="${m.fileUrl.split("/").pop()}"` } });
    } catch {
        return c.json({ success: false, message: "File not found" }, 404);
    }
});

bankSoalRoutes.get("/:id/preview", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);
    const [m] = await db.select().from(bankSoal).where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!m) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    await logActivity(user.id, "preview_bank_soal", "bank_soal", c.req.param("id"));

    if (m.fileUrl.startsWith("http")) {
        return c.redirect(m.fileUrl);
    }

    try {
        const fbPath = m.fileUrl.replace("/uploads/bank-soal/", "bank-soal/");
        const buffer = await downloadFromFirebase(fbPath);
        return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${m.fileUrl.split("/").pop()}"` } });
    } catch {
        return c.json({ success: false, message: "File not found" }, 404);
    }
});
