const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const masjidSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter a mosque name!'
  },
  imam_name: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter the name of the mosque imam!'
  },
  imam_phone_no: {
    type: Number,
    required: 'SubhanaLlah! You must supply the phone number of the mosque imam!'
  },
  sec_name: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter the name of the Deputy Imam / Mosque Secretary / Mosque Admin or Committee member!'
  },
  sec_phone_no: {
    type: Number,
    required: 'SubhanaLlah! You must supply the phone number of the Deputy Imam / Mosque Secretary / Mosque Admin or Committee member!'
  },
  madrasah_name: {
    type: String,
    trim: true,
  },
  madrasah_contact_name: {
    type: String,
    trim: true,
  },
  madrasah_phone_no: {
    type: Number,
  },
  population: {
    type: Number,
    required: 'SubhanaLlah! You must supply the average population size of the mosque!'
  },
  lang_services: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter the language of service of the mosque!'
  },
  website: {
    type: String,
    trim: true,
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  imam_tags: [String],
  madrasah_tags: [String],
  mosque_type: [String],
  mosque_category: [String],
  year_founded: {
    type: Number,
    required: 'SubhanaLlah! Please enter the founding year of the mosque!'
  },
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'SubhanaLlah! You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'SubhanaLlah! You must supply an address!'
    },
    city: {
      type: String,
      required: 'SubhanaLlah! You must supply a city!'
    },
    state: {
      type: String,
      required: 'SubhanaLlah! You must supply a state!'
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'SubhanaLlah! You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
masjidSchema.index({
  name: 'text',
  description: 'text',
  //imam_name: 'text',
  //sec_name: 'text',
  //madrasah_name: 'text'
});

masjidSchema.index({ location: '2dsphere' });

masjidSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other masajid that have a slug of masjid, masjid-1, masdjid-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const masajidWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (masajidWithSlug.length) {
    this.slug = `${this.slug}-${masajidWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

masjidSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

masjidSchema.statics.getTopMasajid = function() {
  return this.aggregate([
    // Lookup Masajid and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'masjid', as: 'reviews' }},
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to at most 10
    { $limit: 10 }
  ]);
}

// find reviews where the masajid _id property === reviews masjid property
masjidSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the masjid?
  foreignField: 'masjid' // which field on the review?
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

masjidSchema.pre('find', autopopulate);
masjidSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Masjid', masjidSchema);
