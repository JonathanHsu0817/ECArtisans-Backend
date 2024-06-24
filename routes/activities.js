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
    });
    if (!activity) {
      return res.status(404).json({ message: "查無資料" });
    }
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 賣家後台取得所有活動
router.get("/shop", isAuth, restriction("seller"), async (req, res) => {
  // 頁碼預設為1、單頁資料筆數預設為5
  const { page = 1, limit = 5 } = req.query;

  try {
    const activities = await Activities.find({ seller: req.user._id })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Activities.countDocuments({ seller: req.user._id });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 賣家後台取得單一活動
router.get("/shop/:id", isAuth, restriction("seller"), async (req, res) => {
  try {
    const activity = await Activities.findOne({
      _id: req.params.id,
      seller: req.user._id,
    });
    if (!activity) {
      return res.status(404).json({ message: "查無資料" });
    }
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 新增活動
router.post("/", isAuth, restriction("seller"), async (req, res) => {
  const {
    activity_name,
    activity_images,
    activity_state,
    start_date,
    end_date,
    description,
    category,
  } = req.body;

  if (
    !activity_name ||
    !activity_images ||
    !activity_state ||
    !start_date ||
    !end_date ||
    !description ||
    !category
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newActivity = new Activities({
    activity_name,
    activity_images,
    activity_state,
    start_date,
    end_date,
    seller: req.user._id,
    description,
    category,
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
    activity_images,
    activity_state,
    start_date,
    end_date,
    description,
    category,
  } = req.body;

  try {
    const updatedActivity = await Activities.findByIdAndUpdate(
      req.params.id,
      {
        activity_name,
        activity_images,
        activity_state,
        start_date,
        end_date,
        seller: req.user._id,
        description,
        category,
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

    // TODO:更新賣家的 activity 陣列，移除被刪除的活動 ID 沒有成功
    const updatedSeller = await Seller.findByIdAndUpdate(
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
