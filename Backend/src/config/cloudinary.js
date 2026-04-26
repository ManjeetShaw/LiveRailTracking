const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');    // Multer  handles File Upload in Express

CloudinaryStorage.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key:    process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
});

// Filtering the file allowing only theimages
const imageFileFilter = (req, file, cb) => {
  // cb = callback. cb(null, true) = accept, cb(error) = reject
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);   // image/jpeg, image/png, image/webp → accept
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

//Train Photos
 const trainPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'ekkwomm/train-photos',
    // All train photos go into this Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
        //Resize to max 1200x800, auto compress
        //saves storage and speeds up page loads
  }
});

 //Storage 2: User avatars ─────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'ekkwomm/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
    // crop: 'fill' = exact square crop
    // gravity: 'face' = centre crop on detected face
  }
});
 
// ── Storage 3: Hygiene report photos ───────────
const hygienePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'ekkwomm/hygiene-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
  }
});
 
// ── Create Multer upload instances ─────────────
// Each has its own Cloudinary folder + size limit
 
const uploadTrainPhoto = multer({
  storage:    trainPhotoStorage,
  fileFilter: imageFileFilter,
  limits:     { fileSize: 10 * 1024 * 1024 }  // 10MB max
});
 
const uploadAvatar = multer({
  storage:    avatarStorage,
  fileFilter: imageFileFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }   // 5MB max
});
 
const uploadHygienePhoto = multer({
  storage:    hygienePhotoStorage,
  fileFilter: imageFileFilter,
  limits:     { fileSize: 10 * 1024 * 1024 }  // 10MB max
});
 
// Usage example in a route:
//   router.post('/posts', protect, uploadTrainPhoto.array('images', 5), createPost)
//   .array('images', 5) = accept up to 5 files in field named 'images'
//   After this runs, uploaded files are in req.files
 
module.exports = { cloudinary, uploadTrainPhoto, uploadAvatar, uploadHygienePhoto };
 
