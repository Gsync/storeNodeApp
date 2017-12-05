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
    }
});

storeSchema.pre('save', function(next) {
    if (!this.isModified('name')) { //if store name is not modified
        return next(); //skip it 
    }
    this.slug = slug(this.name); //convert the name into slug before(pre) saving to db
    next();
});

module.exports = mongoose.model('Store', storeSchema);