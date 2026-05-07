const multer = require('multer');

// ============================================================
// MEMORY STORAGE: Files are kept as Buffer in req.file.buffer
// Nothing ever touches the disk — ideal for transient CSV data
// ============================================================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const isCsv =
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' || // Some OS report CSV as this
        file.originalname.toLowerCase().endsWith('.csv');

    if (isCsv) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only .csv files are permitted.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
        files:    1                 // Only one file per request
    }
});

module.exports = upload;
