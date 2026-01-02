const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
    usdtToNgn: {
        type: Number,
        required: true,
        default: 1450
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

// Ensure only one exchange rate document exists
exchangeRateSchema.statics.getRate = async function () {
    let rate = await this.findOne();
    if (!rate) {
        rate = await this.create({ usdtToNgn: 1450 });
    }
    return rate;
};

exchangeRateSchema.statics.updateRate = async function (newRate, userId) {
    let rate = await this.findOne();
    if (!rate) {
        rate = new this({ usdtToNgn: newRate, updatedBy: userId });
    } else {
        rate.usdtToNgn = newRate;
        rate.lastUpdated = Date.now();
        rate.updatedBy = userId;
    }
    await rate.save();
    return rate;
};

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
