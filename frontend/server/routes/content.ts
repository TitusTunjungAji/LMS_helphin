import { Hono } from "hono";
import { db } from "../db";
import { materials, mataKuliah, prodi, bankSoal, users } from "../schema";
import { eq, and, ilike } from "drizzle-orm";
import { getAuthUser, requirePermission, requireProdiAccessOrAdmin } from "../auth";
import { logActivity } from "../logger";
import { cache, CACHE_TTL } from "../cache";
import { uploadToFirebase, deleteFromFirebase, downloadFromFirebase } from "../firebase";

function firebaseObjectPath(fileUrl?: string | null) {
    if (!fileUrl || !fileUrl.includes("storage.googleapis.com")) return null;
    return fileUrl.split("/").slice(4).join("/");
}

function asUploadFile(value: FormDataEntryValue | null) {
    if (!value || typeof value === "string") return null;
    const file = value as File;
    return file.size > 0 ? file : null;
}

async function parseContentPatch(c: any) {
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
        const formData = await c.req.formData();
        return {
            contentType,
            title: (formData.get("title") as string) || undefined,
            description: formData.has("description") ? String(formData.get("description") ?? "") : undefined,
            tahunAjaran: (formData.get("tahunAjaran") as string) || undefined,
            mataKuliahId: (formData.get("mataKuliahId") as string) || undefined,
            file: asUploadFile(formData.get("file")),
        };
    }
    const body = await c.req.json();
    return {
        contentType,
        title: body.title,
        description: body.description,
        tahunAjaran: body.tahunAjaran,
        mataKuliahId: body.mataKuliahId,
        file: null as File | null,
    };
}

async function replaceStoredFile(existingUrl: string, folder: string, file: File) {
    const oldPath = firebaseObjectPath(existingUrl);
    if (oldPath) await deleteFromFirebase(oldPath);
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadToFirebase(buffer, fileName, file.type);
    return { fileUrl, fileType: file.name.split(".").pop() || "unknown" };
}

function mimeFromFileType(fileType?: string | null, fallback = "application/octet-stream") {
    const t = (fileType || "").toLowerCase();
    if (t === "pdf") return "application/pdf";
    if (t === "doc") return "application/msword";
    if (t === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (t === "ppt") return "application/vnd.ms-powerpoint";
    if (t === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (t === "xls") return "application/vnd.ms-excel";
    if (t === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (t === "png") return "image/png";
    if (t === "jpg" || t === "jpeg") return "image/jpeg";
    return fallback;
}

async function serveStoredFile(fileUrl: string, folderFallback: string, fileType: string | null, disposition: "inline" | "attachment") {
    const fbPath = firebaseObjectPath(fileUrl)
        || fileUrl.replace("/uploads/bank-soal/", "bank-soal/").replace("/uploads/", `${folderFallback}/`);
    const buffer = await downloadFromFirebase(fbPath);
    const filename = decodeURIComponent((fileUrl.split("/").pop() || "file").replace(/"/g, ""));
    const contentType = mimeFromFileType(fileType, disposition === "inline" ? "application/pdf" : "application/octet-stream");
    return new Response(new Uint8Array(buffer), {
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": `${disposition}; filename="${filename}"`,
            "Cache-Control": "private, max-age=0, must-revalidate",
        },
    });
}

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
    const payload = await parseContentPatch(c);
    const [existing] = await db.select().from(materials).where(eq(materials.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Material not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const updateData: any = { updatedAt: new Date() };
    if (payload.title) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.tahunAjaran) updateData.tahunAjaran = payload.tahunAjaran;
    if (payload.mataKuliahId) updateData.mataKuliahId = payload.mataKuliahId;
    if (payload.file) {
        const replaced = await replaceStoredFile(existing.fileUrl, "materials", payload.file);
        updateData.fileUrl = replaced.fileUrl;
        updateData.fileType = replaced.fileType;
    }
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'D',location:'frontend/server/routes/content.ts:materialRoutes.patch',message:'Materials PATCH after file-replace support',data:{contentType:payload.contentType,hasFile:!!payload.file,fileName:payload.file?.name||null,updateKeys:Object.keys(updateData),fileReplaced:!!updateData.fileUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    try {
        const res = await serveStoredFile(m.fileUrl, "materials", m.fileType, "attachment");
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'E',location:'frontend/server/routes/content.ts:materialRoutes.download',message:'Materials download proxied',data:{id:c.req.param("id"),isHttp:m.fileUrl.startsWith("http"),fileType:m.fileType},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return res;
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
    const payload = await parseContentPatch(c);
    const [existing] = await db.select().from(bankSoal).where(eq(bankSoal.id, c.req.param("id"))).limit(1);
    if (!existing) return c.json({ success: false, message: "Bank Soal not found" }, 404);
    if (!requireProdiAccessOrAdmin(existing.prodiId, user!)) return c.json({ success: false, message: "Forbidden" }, 403);
    const updateData: any = { updatedAt: new Date() };
    if (payload.title) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.tahunAjaran) updateData.tahunAjaran = payload.tahunAjaran;
    if (payload.mataKuliahId) updateData.mataKuliahId = payload.mataKuliahId;
    if (payload.file) {
        const replaced = await replaceStoredFile(existing.fileUrl, "bank-soal", payload.file);
        updateData.fileUrl = replaced.fileUrl;
        updateData.fileType = replaced.fileType;
    }
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'D',location:'frontend/server/routes/content.ts:bankSoalRoutes.patch',message:'Bank soal PATCH after file-replace support',data:{contentType:payload.contentType,hasFile:!!payload.file,fileName:payload.file?.name||null,updateKeys:Object.keys(updateData),fileReplaced:!!updateData.fileUrl},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
    try {
        const res = await serveStoredFile(m.fileUrl, "bank-soal", m.fileType, "attachment");
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'E',location:'frontend/server/routes/content.ts:bankSoalRoutes.download',message:'Bank soal download proxied',data:{id:c.req.param("id"),isHttp:m.fileUrl.startsWith("http"),fileType:m.fileType},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return res;
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
    try {
        const res = await serveStoredFile(m.fileUrl, "bank-soal", m.fileType || "pdf", "inline");
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'E',location:'frontend/server/routes/content.ts:bankSoalRoutes.preview',message:'Bank soal preview proxied',data:{id:c.req.param("id"),isHttp:m.fileUrl.startsWith("http"),fileType:m.fileType},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return res;
    } catch {
        return c.json({ success: false, message: "File not found" }, 404);
    }
});
