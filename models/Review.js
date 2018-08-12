const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'SubhanaLlah! You must supply an author!'
  },
  masjid: {
    type: mongoose.Schema.ObjectId,
    ref: 'Masjid',
    required: 'SubhanaLlah! You must supply a masjid!'
  },
  text: {
    type: String,
    required: 'SubhanaLlah! Your review must have text!'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
});

function autopopulate(next) {
  this.populate('author');
  next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
