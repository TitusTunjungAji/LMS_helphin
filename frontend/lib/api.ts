export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function superadminReturnPath(returnTo: string | null | undefined, fallback: string) {
    if (
        returnTo &&
        returnTo.startsWith("/superadmin/") &&
        !returnTo.startsWith("//") &&
        !returnTo.includes("://")
    ) {
        return returnTo;
    }
    return fallback;
}
