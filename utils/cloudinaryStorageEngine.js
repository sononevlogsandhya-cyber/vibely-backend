const cloudinary = require("../config/cloudinary");

/**
 * A minimal multer storage engine that uploads files straight to Cloudinary
 * via a stream, without ever touching local disk. Implements the two methods
 * multer requires (_handleFile, _removeFile) itself, so we don't depend on
 * multer-storage-cloudinary (which pins an old cloudinary@1.x peer dependency
 * that conflicts with cloudinary@2.x).
 *
 * req.file.path is set to the Cloudinary secure_url (what the rest of the
 * app expects), and req.file.filename is set to the Cloudinary public_id.
 */
class CloudinaryStorageEngine {
  constructor({ folder, resourceType = "image", transformation } = {}) {
    this.folder = folder;
    this.resourceType = resourceType;
    this.transformation = transformation;
  }

  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: this.folder,
        resource_type: this.resourceType,
        transformation: this.transformation,
      },
      (err, result) => {
        if (err) return cb(err);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
          mimetype: file.mimetype,
        });
      }
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    cloudinary.uploader.destroy(file.filename, { resource_type: this.resourceType }).then(
      () => cb(null),
      (err) => cb(err)
    );
  }
}

module.exports = CloudinaryStorageEngine;
