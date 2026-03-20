import { describe, it, expect } from "vitest";
import {
  createInvitationSchema,
  acceptInvitationSchema,
  validateTokenSchema,
  getInvitationStatus,
} from "../invitation-validations";

describe("invitation-validations", () => {
  // ═══════════════════════════════════════════════════════════════
  // createInvitationSchema
  // ═══════════════════════════════════════════════════════════════
  describe("createInvitationSchema", () => {
    it("debe validar datos válidos", () => {
      const result = createInvitationSchema.safeParse({
        email: "user@example.com",
        role: "user",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar email inválido", () => {
      const result = createInvitationSchema.safeParse({
        email: "no-email",
        role: "user",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar email vacío", () => {
      const result = createInvitationSchema.safeParse({
        email: "",
        role: "user",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar rol inválido", () => {
      const result = createInvitationSchema.safeParse({
        email: "user@example.com",
        role: "superadmin",
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar rol admin", () => {
      const result = createInvitationSchema.safeParse({
        email: "admin@example.com",
        role: "admin",
      });
      expect(result.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // acceptInvitationSchema
  // ═══════════════════════════════════════════════════════════════
  describe("acceptInvitationSchema", () => {
    it("debe validar datos válidos", () => {
      const result = acceptInvitationSchema.safeParse({
        token: "abc123",
        name: "Juan Pérez",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar password < 8 caracteres", () => {
      const result = acceptInvitationSchema.safeParse({
        token: "abc123",
        name: "Juan",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar nombre < 2 caracteres", () => {
      const result = acceptInvitationSchema.safeParse({
        token: "abc123",
        name: "J",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validateTokenSchema
  // ═══════════════════════════════════════════════════════════════
  describe("validateTokenSchema", () => {
    it("debe validar token no vacío", () => {
      const result = validateTokenSchema.safeParse({ token: "abc123" });
      expect(result.success).toBe(true);
    });

    it("debe rechazar token vacío", () => {
      const result = validateTokenSchema.safeParse({ token: "" });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getInvitationStatus
  // ═══════════════════════════════════════════════════════════════
  describe("getInvitationStatus", () => {
    const futureDate = new Date(Date.now() + 86400000); // +1 día
    const pastDate = new Date(Date.now() - 86400000); // -1 día

    it("debe retornar PENDING cuando no está usada, cancelada ni expirada", () => {
      const status = getInvitationStatus({
        usedAt: null,
        cancelledAt: null,
        expiresAt: futureDate,
      });
      expect(status).toBe("PENDING");
    });

    it("debe retornar ACCEPTED cuando tiene usedAt", () => {
      const status = getInvitationStatus({
        usedAt: new Date(),
        cancelledAt: null,
        expiresAt: futureDate,
      });
      expect(status).toBe("ACCEPTED");
    });

    it("debe retornar EXPIRED cuando expiresAt está en el pasado", () => {
      const status = getInvitationStatus({
        usedAt: null,
        cancelledAt: null,
        expiresAt: pastDate,
      });
      expect(status).toBe("EXPIRED");
    });

    it("debe retornar CANCELLED cuando tiene cancelledAt", () => {
      const status = getInvitationStatus({
        usedAt: null,
        cancelledAt: new Date(),
        expiresAt: futureDate,
      });
      expect(status).toBe("CANCELLED");
    });

    it("debe priorizar CANCELLED sobre ACCEPTED", () => {
      const status = getInvitationStatus({
        usedAt: new Date(),
        cancelledAt: new Date(),
        expiresAt: futureDate,
      });
      expect(status).toBe("CANCELLED");
    });

    it("debe priorizar CANCELLED sobre EXPIRED", () => {
      const status = getInvitationStatus({
        usedAt: null,
        cancelledAt: new Date(),
        expiresAt: pastDate,
      });
      expect(status).toBe("CANCELLED");
    });
  });
});
