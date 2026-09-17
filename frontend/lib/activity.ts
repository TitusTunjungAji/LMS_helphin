export function formatActivityAction(action?: string) {
  const map: Record<string, string> = {
    login: "masuk ke sistem",
    register: "mendaftar akun",
    update_profile: "memperbarui profil",
    create_admin: "menambah akun",
    update_user: "mengubah akun",
    delete_user: "menghapus akun",
    create_fakultas: "menambah fakultas",
    update_fakultas: "mengubah fakultas",
    delete_fakultas: "menghapus fakultas",
    create_prodi: "menambah prodi",
    update_prodi: "mengubah prodi",
    delete_prodi: "menghapus prodi",
    create_role: "menambah role",
    update_role: "mengubah role",
    delete_role: "menghapus role",
    create_mata_kuliah: "menambah mata kuliah",
    update_mata_kuliah: "mengubah mata kuliah",
    delete_mata_kuliah: "menghapus mata kuliah",
    upload_material: "mengunggah materi",
    update_material: "mengubah materi",
    delete_material: "menghapus materi",
    download_material: "mengunduh materi",
    upload_bank_soal: "mengunggah bank soal",
    update_bank_soal: "mengubah bank soal",
    delete_bank_soal: "menghapus bank soal",
    download_bank_soal: "mengunduh bank soal",
    preview_bank_soal: "melihat bank soal",
    create_video: "menambah video",
    update_video: "mengubah video",
    delete_video: "menghapus video",
    create_responsi: "menambah responsi",
    update_responsi: "mengubah responsi",
    delete_responsi: "menghapus responsi",
    create_exercise: "menambah latihan soal",
    update_exercise: "mengubah latihan soal",
    delete_exercise: "menghapus latihan soal",
    create_request: "mengirim request materi",
    delete_request: "menghapus request materi",
    send_support_ticket: "mengirim tiket support",
    forgot_password_request: "meminta reset password",
    reset_password: "mereset password",
  };
  return map[action || ""] || (action || "melakukan aktivitas").replace(/_/g, " ");
}

export function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
