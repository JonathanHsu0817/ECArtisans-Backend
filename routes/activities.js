let express = require("express");
let router = express.Router();
const { isAuth, restriction } = require("../middlewares/isAuth");

const Activities = require("../models/activity");
const Seller = require("../models/seller");

// 前台取得單一活動詳情
router.get("/:id", async (req, res) => {
  try {
    const activity = await Activities.findOne({
      _id: req.params.id,
    }).lean();

    if (!activity) {
      return res.status(404).json({ message: "查無資料" });
    }

    const formattedActivity = {
      activity_id: activity._id,
      seller_id: activity.seller_id,
      activity_name: activity.activity_name,
      activity_image: activity.activity_image,
      start_date: activity.start_date,
      end_date: activity.end_date,
      activity_info: activity.activity_info,
      coupon_id: activity.coupon_id,
    };

    res.status(200).json({
      status: true,
      data: [formattedActivity],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 新增活動
router.post("/", isAuth, restriction("seller"), async (req, res) => {
  const {
    activity_name,
    activity_image,
    start_date,
    end_date,
    activity_info,
    coupon_id,
  } = req.body;

  if (
    !activity_name ||
    !activity_image ||
    !start_date ||
    !end_date ||
    !activity_info ||
    !coupon_id
  ) {
    return res.status(400).json({ message: "所有欄位不可缺少" });
  }

  const newActivity = new Activities({
    seller_id: req.user._id,
    activity_name,
    activity_image,
    start_date,
    end_date,
    activity_info,
    coupon_id,
  });

  try {
    // 保存新活動
    const savedActivity = await newActivity.save();

    // 更新賣家的 activity 陣列
    await Seller.findByIdAndUpdate(
      req.user._id,
      { $push: { activity: savedActivity._id } },
      { new: true }
    );

    res.status(201).json({ message: "新增活動成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 修改活動
router.put("/:id", isAuth, restriction("seller"), async (req, res) => {
  const {
    activity_name,
    activity_image,
    start_date,
    end_date,
    activity_info,
    coupon_id,
  } = req.body;

  try {
    const updatedActivity = await Activities.findByIdAndUpdate(
      req.params.id,
      {
        seller_id: req.user._id,
        activity_name,
        activity_image,
        start_date,
        end_date,
        activity_info,
        coupon_id,
      },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res.status(404).json({ message: "查無資料" });
    }

    res.status(200).json({ message: "活動修改成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 刪除活動
router.delete("/:id", isAuth, restriction("seller"), async (req, res) => {
  try {
    // 刪除活動
    const deletedActivity = await Activities.findByIdAndDelete(req.params.id);

    if (!deletedActivity) {
      return res.status(404).json({ message: "查無資料" });
    }

    await Seller.findByIdAndUpdate(
      req.user._id,
      { $pull: { activity: req.params.id } },
      { new: true }
    );

    res.status(200).json({ message: "資料成功刪除" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
