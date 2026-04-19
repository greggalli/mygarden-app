import { getAll, put, remove } from "../db/indexedDb";
import { STORE_NAMES } from "../db/stores";

export function getAllSpeciesPhotos() {
  return getAll(STORE_NAMES.speciesPhotos);
}

export function saveSpeciesPhoto(photo) {
  return put(STORE_NAMES.speciesPhotos, photo);
}

export function deleteSpeciesPhotoById(photoId) {
  return remove(STORE_NAMES.speciesPhotos, photoId);
}
