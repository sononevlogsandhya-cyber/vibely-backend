const multer = require("multer");
const CloudinaryStorageEngine = require("../utils/cloudinaryStorageEngine");

// Stories can be an image or a short video - "auto" lets Cloudinary
// detect and store either correctly.
const storage = new CloudinaryStorageEngine({
  folder: "vibely/stories",
  resourceType: "auto",
});

function fileFilter(req, file, cb) {
  const okImage = /image\//.test(file.mimetype);
  const okVideo = /video\//.test(file.mimetype);
  if (okImage || okVideo) return cb(null, true);
  cb(new Error("Only image or video files are allowed"));
}

const uploadStory = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

module.exports = uploadStory;
