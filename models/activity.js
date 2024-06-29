const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sellers",
      required: true,
    },
    activity_name: { type: String, required: true },
    activity_image: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    activity_info: { type: String, required: true },
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupons",
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
