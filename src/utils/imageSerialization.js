const DATA_URL_BASE64_REGEX = /^data:([\w.+-]+\/[\w.+-]+)?;base64,[A-Za-z0-9+/=\s]+$/;

export function isDataUrl(value) {
  return typeof value === "string" && DATA_URL_BASE64_REGEX.test(value.trim());
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (!(blob instanceof Blob)) {
      reject(new Error("blobToDataUrl attend un Blob."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Impossible de sérialiser l'image."));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl) {
  if (!isDataUrl(dataUrl)) {
    throw new Error("Format d'image non supporté: data URL base64 invalide.");
  }

  const [header, payload] = dataUrl.split(",");
  const mimeType = header.slice(5, header.indexOf(";")) || "application/octet-stream";
  const binary = window.atob(payload.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

export function normalizeMimeType(mimeType, filename = "") {
  if (mimeType && typeof mimeType === "string") {
    return mimeType;
  }

  if (filename.endsWith(".png")) {
    return "image/png";
  }

  if (filename.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}
