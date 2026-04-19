import { validateBackupPayload } from "./backupService";

describe("validateBackupPayload", () => {
  it("accepts a valid payload object", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: { species: [] }
      })
    ).not.toThrow();
  });

  it("rejects non object payload", () => {
    expect(() => validateBackupPayload(null)).toThrow(/invalide/);
  });
});
