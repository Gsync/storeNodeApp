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
    tags:  [String]
});

storeSchema.pre('save', function(next) {
    if (!this.isModified('name')) { //if store name is not modified
        return next(); //skip it 
    }
    this.slug = slug(this.name); //convert the name into slug before(pre) saving to db
    next();
});

module.exports = mongoose.model('Store', storeSchema);