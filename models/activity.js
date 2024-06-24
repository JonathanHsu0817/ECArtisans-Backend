const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activity_name: { type: String, required: true },
    activity_images: { type: [String], required: true },
    activity_state: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sellers",
      required: true,
    },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["活動", "公告"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
