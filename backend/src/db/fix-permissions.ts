import { db, client } from "./index";
import { roles } from "./schema";
import { eq } from "drizzle-orm";

async function fixPermissions() {
    console.log("🔧 Fixing role permissions...");

    await db.update(roles)
        .set({ permissions: ["*"] })
        .where(eq(roles.code, "super_admin"));
    console.log('✅ super_admin → permissions: ["*"]');

    await db.update(roles)
        .set({ permissions: ["dashboard:view", "materi:view", "materi:edit", "materi:create", "materi:delete", "video:view", "video:edit", "video:create", "video:delete", "responsi:view", "responsi:edit", "responsi:create", "responsi:delete", "bank_soal:view", "bank_soal:manage"] })
        .where(eq(roles.code, "admin"));
    console.log("✅ admin → permissions updated");

    await db.update(roles)
        .set({ permissions: ["dashboard:view"] })
        .where(eq(roles.code, "student"));
    console.log("✅ student → permissions updated");

    console.log("\n🎉 All permissions fixed!");
    await client.end();
    process.exit(0);
}

fixPermissions().catch((err) => {
    console.error("❌ Fix failed:", err);
    process.exit(1);
});
