const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  req.body.masjid = req.params.id;
  const newReview = new Review(req.body);
  await newReview.save();
  req.flash('success', 'AlhamduliLlah! Review Saved!');
  res.redirect('back');
};
