import { describe, expect, it } from "vitest";
import { summarizeParticipant, type ParticipantInput } from "@/lib/domain/admin";
import { addDays } from "@/lib/domain/program";

const START = "2027-01-04";
const d = (n: number) => addDays(START, n - 1);

const base: ParticipantInput = { id: "1", email: "a@b.com", name: "Ana", planReady: true, checkins: [], videos: [] };

describe("resumen de participantes", () => {
  it("marca a quien lleva 2 o más días completos sin check-in", () => {
    const p = { ...base, checkins: [{ date: d(1), slot: "body" as const, level: "min" as const }] };
    // Último check-in el día 1; hoy es el día 3 → solo el día 2 sin nada
    expect(summarizeParticipant(p, START, d(3), true)).toMatchObject({ daysWithoutCheckin: 1, needsAttention: false });
    // Hoy es el día 4 → días 2 y 3 sin nada
    expect(summarizeParticipant(p, START, d(4), true)).toMatchObject({
      lastCheckin: d(1),
      daysWithoutCheckin: 2,
      needsAttention: true,
      daysDone: 1,
    });
  });

  it("sin ningún check-in cuenta desde el día 1", () => {
    expect(summarizeParticipant(base, START, d(2), true).needsAttention).toBe(false);
    expect(summarizeParticipant(base, START, d(3), true).needsAttention).toBe(true);
  });

  it("antes del programa no marca a nadie", () => {
    expect(summarizeParticipant(base, START, addDays(START, -5), false)).toMatchObject({
      daysWithoutCheckin: null,
      needsAttention: false,
    });
  });

  it("cuenta los vídeos aprobados y pendientes", () => {
    const p = { ...base, videos: [{ status: "approved" as const }, { status: "pending" as const }, { status: "rejected" as const }] };
    expect(summarizeParticipant(p, START, d(1), true)).toMatchObject({ videosApproved: 1, videosPending: 1 });
  });
});
