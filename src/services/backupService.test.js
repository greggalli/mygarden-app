import { parseBackupFile, validateBackupPayload } from "./backupService";

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
        speciesPhotos: []
      }
    };

    expect(() => validateBackupPayload(payload)).not.toThrow();
  });


  it("accepts species photo entries with speciesId set to 0", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: {
          zones: [],
          species: [],
          plantations: [],
          tasks: [],
          speciesPhotos: [
            {
              id: "img-0",
              speciesId: 0,
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
    ).toThrow(/speciesPhotos/);
  });

  it("rejects a non-object payload", () => {
    expect(() => validateBackupPayload(null)).toThrow(/invalide/);
  });

  it("rejects invalid species photo data urls", () => {
    expect(() =>
      validateBackupPayload({
        version: 1,
        data: {
          zones: [],
          species: [],
          plantations: [],
          tasks: [],
          speciesPhotos: [
            {
              id: "a",
              speciesId: 1,
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
