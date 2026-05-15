import { db } from "./server/db";
import { users, roles } from "./server/schema";
import { eq, isNull } from "drizzle-orm";

async function syncAll() {
    console.log("🔄 Starting full sync of roles and permissions...");

    const defaultRoles = [
        {
            name: "Super Admin",
            code: "super_admin",
            permissions: ["*"]
        },
        {
            name: "Admin Prodi",
            code: "admin",
            permissions: [
                "dashboard:view",
                "akun:view", "akun:manage",
                "prodi:view", "prodi:manage",
                "matkul:view", "matkul:manage",
                "materi:view", "materi:manage",
                "video:view", "video:manage",
                "responsi:view", "responsi:manage",
                "latihan:view", "latihan:manage",
                "bank_soal:view", "bank_soal:manage",
                "log:view"
            ]
        },
        {
            name: "Student",
            code: "student",
            permissions: ["dashboard:view", "matkul:view", "materi:view", "video:view", "responsi:view", "latihan:view", "bank_soal:view"]
        },
    ];

    for (const roleDef of defaultRoles) {
        const [existing] = await db.select().from(roles).where(eq(roles.code, roleDef.code)).limit(1);
        if (!existing) {
            console.log(`✨ Creating role: ${roleDef.name}`);
            await db.insert(roles).values(roleDef as any);
        } else {
            console.log(`✅ Updating permissions: ${roleDef.code}`);
            await db.update(roles).set({ permissions: roleDef.permissions } as any).where(eq(roles.code, roleDef.code));
        }
    }

    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map(r => [r.code, r.id]));
    const roleIds = allRoles.map(r => r.id);

    const orphanedUsers = await db.select().from(users).where(isNull(users.roleId));
    for (const user of orphanedUsers) {
        let targetCode = "student";
        if (user.email.includes("superadmin")) targetCode = "super_admin";
        else if (user.email.includes("admin")) targetCode = "admin";
        const targetId = roleMap.get(targetCode);
        if (targetId) {
            await db.update(users).set({ roleId: targetId }).where(eq(users.id, user.id));
            console.log(`👤 Fixed user ${user.email} → ${targetCode}`);
        }
    }

    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
        if (user.roleId && !roleIds.includes(user.roleId)) {
            let targetCode = "student";
            if (user.email.includes("superadmin")) targetCode = "super_admin";
            else if (user.email.includes("admin")) targetCode = "admin";
            const targetId = roleMap.get(targetCode);
            if (targetId) {
                await db.update(users).set({ roleId: targetId }).where(eq(users.id, user.id));
                console.log(`👤 Fixed orphan ${user.email} → ${targetCode}`);
            }
        }
    }

    console.log("🎉 Sync complete!");
    process.exit(0);
}

syncAll().catch(err => { console.error("❌ Sync failed:", err); process.exit(1); });
