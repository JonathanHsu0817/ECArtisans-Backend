const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const reviewSchema = new Schema(
    {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        rate: {
            type: Number,
            required: [true, '請選擇評價'],
            min: 1,
            max: 5
        },
        createAt: {
            type: Date,
            default: Date.now,
			select: false,
        },
    },
    { versionKey: false }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;


