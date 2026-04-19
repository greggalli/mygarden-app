async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch (_error) {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchBootstrapData() {
  return request("/api/bootstrap");
}

export function createSpecies(payload) {
  return request("/api/species", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSpeciesById(id, payload) {
  return request(`/api/species/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteSpeciesByIdApi(id) {
  return request(`/api/species/${id}`, { method: "DELETE" });
}

export async function uploadSpeciesPhotos(speciesId, files) {
  const uploaded = [];

  for (const file of files) {
    const encodedFilename = encodeURIComponent(file.name || "photo");
    const result = await request(
      `/api/species/${speciesId}/photos?filename=${encodedFilename}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      }
    );
    if (result?.photo) {
      uploaded.push(result.photo);
    }
  }

  return { photos: uploaded };
}

export function deleteSpeciesPhotoByIdApi(speciesId, photoId) {
  return request(`/api/species/${speciesId}/photos/${photoId}`, {
    method: "DELETE"
  });
}

export function createPlantation(payload) {
  return request("/api/plantations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePlantationById(id, payload) {
  return request(`/api/plantations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePlantationByIdApi(id) {
  return request(`/api/plantations/${id}`, {
    method: "DELETE"
  });
}

export function fetchBackupPayload() {
  return request("/api/admin/export");
}

export function importBackupPayload(payload) {
  return request("/api/admin/import", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
