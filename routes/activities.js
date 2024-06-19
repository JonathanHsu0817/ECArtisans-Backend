let express = require("express");
let router = express.Router();

const Activities = require("../models/activity");

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
router.get("/shop/:sellerId", async (req, res) => {
  // 頁碼預設為1、單頁資料筆數預設為5
  const { page = 1, limit = 5 } = req.query;

  try {
    const activities = await Activities.find({ sellerId: req.params.sellerId })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Activities.countDocuments({
      sellerId: req.params.sellerId,
    });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// 賣家後台取得單一活動
router.get("/shop/:sellerId/:id", async (req, res) => {
  try {
    const activity = await Activities.findOne({
      _id: req.params.id,
      sellerId: req.params.sellerId,
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
router.post("/", async (req, res) => {
  const {
    activity_id,
    activity_name,
    activity_images,
    activity_state,
    start_date,
    end_date,
    sellerId,
    description,
  } = req.body;

  if (
    !activity_id ||
    !activity_name ||
    !activity_images ||
    !activity_state ||
    !start_date ||
    !end_date ||
    !sellerId ||
    !description
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newActivity = new Activities({
    activity_id,
    activity_name,
    activity_images,
    activity_state,
    start_date,
    end_date,
    sellerId,
    description,
  });

  try {
    const savedActivity = await newActivity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 修改活動
router.put("/:id", async (req, res) => {
  const {
    activity_id,
    activity_name,
    activity_images,
    activity_state,
    start_date,
    end_date,
    sellerId,
    description,
  } = req.body;

  try {
    const updatedActivity = await Activities.findByIdAndUpdate(
      req.params.id,
      {
        activity_id,
        activity_name,
        activity_images,
        activity_state,
        start_date,
        end_date,
        sellerId,
        description,
      },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res.status(404).json({ message: "查無資料" });
    }

    res.status(200).json(updatedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 刪除活動
router.delete("/:id", async (req, res) => {
  try {
    const deletedActivity = await Activities.findByIdAndDelete(req.params.id);

    if (!deletedActivity) {
      return res.status(404).json({ message: "查無資料" });
    }

    res.status(200).json({ message: "資料成功刪除" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
