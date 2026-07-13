const multer = require("multer");
const CloudinaryStorageEngine = require("../utils/cloudinaryStorageEngine");

const storage = new CloudinaryStorageEngine({
  folder: "vibely/images",
  resourceType: "image",
  transformation: [{ quality: "auto", fetch_format: "auto" }],
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const mime = allowed.test(file.mimetype);
  if (mime) return cb(null, true);
  cb(new Error("Only image files are allowed (jpg, png, gif, webp)"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

module.exports = upload;
