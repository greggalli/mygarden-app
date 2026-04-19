const path = require("path");

const DATA_ROOT = process.env.DATA_ROOT || "/data";
const DB_PATH = process.env.DB_PATH || path.join(DATA_ROOT, "db", "garden.sqlite");
const IMAGES_ROOT = process.env.IMAGES_ROOT || path.join(DATA_ROOT, "images");
const SPECIES_IMAGES_DIR = path.join(IMAGES_ROOT, "species");
const PORT = Number(process.env.PORT || 4000);

module.exports = {
  DATA_ROOT,
  DB_PATH,
  IMAGES_ROOT,
  SPECIES_IMAGES_DIR,
  PORT
};
