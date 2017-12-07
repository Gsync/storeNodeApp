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
    photo: String
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

module.exports = mongoose.model('Store', storeSchema);