export type SessionOrder = {
  id: string;
  mentorId: string;
  mentorName: string;
  course: string;
  method: "Daring" | "Tatap muka";
  price: number;
  note: string;
  at: number;
};

const KEY = "helphin-marketplace-orders";

export function readOrders(): SessionOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function placeOrder(order: Omit<SessionOrder, "id" | "at">): SessionOrder {
  const next: SessionOrder = { ...order, id: crypto.randomUUID(), at: Date.now() };
  const orders = [next, ...readOrders()];
  localStorage.setItem(KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("helphin-orders"));
  return next;
}
