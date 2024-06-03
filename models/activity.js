const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    activity_name: { type: String, required: true },
    activity_images: { type: [String], required: true },
    activity_state: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    sellerId: { type: String, required: true },
    description: { type: String, required: true }
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
