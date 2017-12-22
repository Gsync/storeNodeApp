const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer'); //handle file uploading

const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true); //continue with file uploading
        } else {
            next({ message: 'That filetype isnt allowed!' }, false);
        }
    }
};

exports.homePage = (req, res) => {
    console.log(req.name);
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    if (!req.file) { //if there is no file to resize
        next(); //skip to next middleware
        return ; //stop the function running further
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize the photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`); //write photo to filesystem folder
    next(); //keep going
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
        req.flash('success', `Successfully created ${store.name}. Care to leave a review`);
        res.redirect(`/store/${store.slug}`);
        console.log("It worked!");
};

exports.getStores = async (req, res) => {
    //1. Query the database the list of all stores
    const stores =  await Store.find();
    console.log(stores);
    res.render('stores', { title: 'Stores', stores });
}

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) { //can add user levels here by using || user.level < levelX
        throw Error('You must own a store in order to edit it!');
    }
};

exports.editStores = async (req, res) => {
     const store = await Store.findOne({_id: req.params.id});
    confirmOwner(store, req.user); //confirm the user is owner of the store
     res.render('editStore', {title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    //Set the location data to be a point
    req.body.location.type = 'Point';

    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, //return the new store when redirected
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);

    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug })
        .populate('author'); //add user info in the object
    if (!store) return next(); //keep going to next if no store
    res.render('store', { title: store.name, store });
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true }; //show all tags when no tag selected
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', { title: 'Tags', tags: tags, tag: tag, stores: stores });
};

exports.searchStores = async (req, res) => {
    const stores = await Store
        .find({ //find the stores based on query value
            $text: {
                $search: req.query.q
            }
        }, {
            score: {
                $meta: 'textScore'
            }
        })
        .sort({ //sort by score
            score: {
                $meta: 'textScore'
            }
        })
        .limit(5); //limit the results to 5
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [+req.query.lng, +req.query.lat];
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: 10000 //10km
            }
        }
    };
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; //if already is array remove it else add it(unique)
    const user = await User.findByIdAndUpdate(req.user._id, {
            [operator]: { hearts: req.params.id } //[operator] === either $pull or $addToSet - ES6
    }, { new: true }); //returns new updated object 
    console.log(hearts);
    res.json(user);
};

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts } //find where id is $in hearts array
    });
    res.render('stores', { title: 'Hearted Stores', stores: stores });
};