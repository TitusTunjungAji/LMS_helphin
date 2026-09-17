import {
  Library,
  FileText,
  Clapperboard,
  ClipboardList,
  Lightbulb,
  Users,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export function getTopicTypeConfig(type: string): {
  color: string;
  label: string;
  Icon: LucideIcon;
} {
  switch (type) {
    case "bank-soal":
      return { color: "#3B82F6", label: "Bank Soal", Icon: ClipboardList };
    case "e-materi":
      return { color: "#F97316", label: "E-Materi", Icon: FileText };
    case "smart-video":
      return { color: "#22C55E", label: "Video", Icon: Clapperboard };
    case "quiz":
      return { color: "#6366F1", label: "Kuis", Icon: Lightbulb };
    case "responsi":
      return { color: "#EF4444", label: "Responsi", Icon: Users };
    default:
      return { color: "#64748B", label: "Lainnya", Icon: MapPin };
  }
}

export const topicFilterIcons = {
  all: Library,
  "e-materi": FileText,
  "smart-video": Clapperboard,
  "bank-soal": ClipboardList,
  quiz: Lightbulb,
  responsi: Users,
} as const;
