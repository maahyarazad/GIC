const express = require('express');
const fs = require('fs');
const { fromFile, fromBuffer } = require('file-type');
const path = require('path');
const cors = require('cors');
const multer = require('multer')
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5605;
const mime = require('mime-types');
const generateQRWithText = require('./services/qrGenerator');
const isTextFile = require('istextorbinary').isText;


const { sendRequestConfirmationEmail, sendAdminNotificationEmail } = require('./services/emailService');
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

const ALLOWED_MIME_TYPES = [
  'application/pdf', // pdf
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'text/plain', // txt
  'text/csv', // csv
  'application/rtf', // rtf
  'application/zip' // zip
];


// fallback MIME types
const FALLBACK_MIME_TYPES = {
  csv: 'text/csv',
  txt: 'text/plain',
};


// Multer
const uploadDir = path.join(__dirname, '/uploads');

const upload = multer({ 
    storage: multer.memoryStorage()
    , limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max





app.get('/api/site-data', (req, res) => {


    const lang = req.query.lang;


    let filePath = path.join(__dirname, 'site-data.json');
    if (lang === "DE") {
        filePath = path.join(__dirname, 'site-data-de.json');
    }

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            // send back server error
            return res.status(500).json({ error: 'Failed to read the file' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return res.status(500).json({ error: 'Failed to parse JSON' });
        }

    })
});





app.post('/api/contact-us', upload.single('attachment'), async (req, res) => {

    try {
        const filePath = path.join(__dirname, 'request-data.json');
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
        }

        const { name, email, message } = req.body;

        let attachment = null;

        const fileBuffer = req.file?.buffer;

        if(fileBuffer){
            const type = await fromBuffer(fileBuffer);
    
            let mimeType = type?.mime;
    
            if (!mimeType) {
            // Check if the file is plain text
                const isText = isTextFile(null, fileBuffer);
    
                if (isText){
                    const originalExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
                    mimeType = FALLBACK_MIME_TYPES[originalExt] || 'text/plain';
                }
            }
    
            // Validation goes here
            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                return res.status(400).json({ error: 'Invalid file type.' });
            }
    
            if (req.file !== undefined && req.file !== null) {
    
                 // Save file after validation
                const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
                const targetPath = path.join(uploadDir, uniqueName);
                fs.writeFileSync(targetPath, fileBuffer);
    
    
                attachment = {
                    originalName: req.file.originalname,
                    storedName: uniqueName,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                };
            }
        }

    

        const newEntry = {
            name,
            email,
            message,
            attachment,
            timestamp: new Date().toISOString()
        };

        const data = fs.readFileSync(filePath, 'utf-8');

        const requestData = JSON.parse(data);

        requestData.push(newEntry);

        fs.writeFileSync(filePath, JSON.stringify(requestData, null, 2), 'utf-8');

        await sendRequestConfirmationEmail(newEntry);

        await sendAdminNotificationEmail(newEntry);

        return res.status(201).json({ message: 'Your request created. Thank you for reaching out to us.' });

    } catch (err) {
        return res.status(500).json({ error: err })
    }

});



// Route to serve your main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.use((req, res, next) => {
  res.status(404).send('Not found');
});

app.use((req, res, next) => {
    console.log(`Received request for: ${req.url}`);
    next();
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
