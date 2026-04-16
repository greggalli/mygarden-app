import { validateBackupPayload } from "./backupService";

describe("validateBackupPayload", () => {
  it("accepts a valid payload", () => {
    const payload = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: {
        zones: [],
        species: [],
        plantations: [],
        tasks: [],
        images: []
      }
    };

    expect(() => validateBackupPayload(payload)).not.toThrow();
  });


  it("accepts image entries with entityId set to 0", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: {
          zones: [],
          species: [],
          plantations: [],
          tasks: [],
          images: [
            {
              id: "img-0",
              entityType: "species",
              entityId: 0,
              filename: "zero.jpg",
              mimeType: "image/jpeg",
              dataUrl: "data:image/jpeg;base64,AA=="
            }
          ]
        }
      })
    ).not.toThrow();
  });
  it("rejects payloads with missing arrays", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: { zones: [], species: [], plantations: [], tasks: [] }
      })
    ).toThrow(/images/);
  });

  it("rejects a non-object payload", () => {
    expect(() => validateBackupPayload(null)).toThrow(/invalide/);
  });

  it("rejects invalid image data urls", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: {
          zones: [],
          species: [],
          plantations: [],
          tasks: [],
          images: [
            {
              id: "a",
              entityType: "species",
              entityId: 1,
              filename: "rose.jpg",
              mimeType: "image/jpeg",
              dataUrl: "not-a-data-url"
            }
          ]
        }
      })
    ).toThrow(/dataUrl/);
  });
});
