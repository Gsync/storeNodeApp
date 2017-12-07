const mongoose = require('mongoose');
const Store = mongoose.model('Store');
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

exports.editStores = async (req, res) => {
     const store = await Store.findOne({_id: req.params.id});

     res.render('editStore', {title: `Edit ${store.name}`, store});
}

exports.updateStore = async (req, res) => {
    //Set the location data to be a point
    req.body.location.type = 'Point';

    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, //return the new store when redirected
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);

    res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug });
    if (!store) return next(); //keep going to next if no store
    res.render('store', { title: store.name, store });
}

exports.getStoresByTag = async (req, res) => {
    const tags = await Store.getTagsList();
    const tag = req.params.tag;
    res.render('tag', { title: 'Tags', tags: tags, tag: tag });
}