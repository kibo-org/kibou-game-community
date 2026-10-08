import { describe, expect, it } from "vitest";
import config from "./vite.config";

describe("local server isolation", () => {
  for (const mode of ["server", "preview"] as const) {
    it(`${mode} stays loopback-only with enforced browser headers`, () => {
      const server = config[mode];
      expect(server?.host).toBe("127.0.0.1");
      expect(server?.strictPort).toBe(true);
      expect(server?.headers?.["X-Frame-Options"]).toBe("DENY");
      expect(server?.headers?.["Referrer-Policy"]).toBe("no-referrer");
      expect(server?.headers?.["X-Content-Type-Options"]).toBe("nosniff");
      const policy = String(server?.headers?.["Content-Security-Policy"]);
      for (const directive of ["connect-src 'none'", "frame-ancestors 'none'", "form-action 'none'", "worker-src 'none'"]) {
        expect(policy).toContain(directive);
      }
    });
  }
  it("does not load environment files or enable hot-reload connections", () => {
    expect(config.envDir).toBe(false);
    expect(config.server?.hmr).toBe(false);
  });
});
