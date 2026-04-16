import { validateBackupPayload } from "./backupService";

describe("validateBackupPayload", () => {
  it("accepts a valid payload", () => {
    const payload = {
      zones: [],
      species: [],
      instances: [],
      tasks: []
    };

    expect(() => validateBackupPayload(payload)).not.toThrow();
  });

  it("rejects payloads with missing arrays", () => {
    expect(() => validateBackupPayload({ zones: [] })).toThrow(/species/);
  });

  it("rejects a non-object payload", () => {
    expect(() => validateBackupPayload(null)).toThrow(/invalide/);
  });
});
