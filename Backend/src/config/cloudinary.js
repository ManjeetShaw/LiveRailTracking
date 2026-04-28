const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 🔐 Configure Cloudinary (IMPORTANT)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ File filter (only images allowed)
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// 📸 Train Photos Storage
const trainPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ekkwomm/train-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ],
  },
});

// 👤 Avatar Storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ekkwomm/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
    ],
  },
});

// 🧼 Hygiene Photos Storage
const hygienePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ekkwomm/hygiene-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto' }
    ],
  },
});

// 🚀 Multer Upload Instances
const uploadTrainPhoto = multer({
  storage: trainPhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadHygienePhoto = multer({
  storage: hygienePhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// 📦 Export everything
module.exports = {
  cloudinary,
  uploadTrainPhoto,
  uploadAvatar,
  uploadHygienePhoto,
};