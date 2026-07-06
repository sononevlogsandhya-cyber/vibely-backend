const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: {
      // jo follow kar raha hai
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      // jisko follow kiya ja raha hai
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
