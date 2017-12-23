const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Please enter a store name!',
        trim: true
    },
    slug: String,
    description:    {
        type: String,
        trim: true
    },
    tags:  [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [
            {
                type: Number,
                required: 'You must supply coordinates!'
            }
        ],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
    
}, {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    } //bring virtuals into the returned object
);

//Define our indexes
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) { //if store name is not modified
        return next(); //skip it 
    }
    this.slug = slug(this.name); //convert the name into slug before(pre) saving to db
    
    //find other store that have same slug
    const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i'); //starts with same slug and mihgt ends with hyphen(-) and a number
    const storesWithSlug = await this.constructor.find({ slug: slugRegex });
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

storeSchema.statics.getTagsList = function () {
    return this.aggregate([
        { $unwind: '$tags' }, //isolate individual stores based on each tag
        { $group: { _id: '$tags', count: { $sum: 1 } }} //group them based on tags and count the stores in each group
    ]);
}

//using mongodb method
storeSchema.statics.getTopStores = function () {
    return this.aggregate([
        //lookup the stores and populate the reviews
        {
            $lookup: {
                from: 'reviews', //reviews is the Review model coming from mongodb
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        {
            //filter for only items that have two or more reviews
            $match: {
                'reviews.1': { //accessing the second index or reviews array in mongodb
                    $exists: true
                }
            }
        },
        //Add the average reviews field (averageRating) and calculate average ($avg)
            //**Note**Replace $addField with $project if old mongodb version(3.2) at mlab
        {
            $addFields: {
                averageRating: {
                    $avg: '$reviews.rating'
                }
            }
        },
        //sort it by our new field, highest first
        {
            $sort: {
                averageRating: -1
            }
        },
        //limit to at most 10
        {
            $limit: 10
        }
    ]);
}

//Using mongoose method: Find reviews where the store _id property === reviews store property
storeSchema.virtual('reviews', {
    ref: 'Review', //what model to link
    localField: '_id', //which field on the store?
    foreignField: 'store' //which field on review
});

//populate reviews to use on store card
function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);