const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4500;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_PATH = IS_VERCEL ? '/tmp/data.json' : path.join(__dirname, 'data.json');
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from root directory
app.use('/assets', express.static('assets'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (!fs.existsSync(UPLOADS_DIR)) {
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            }
            cb(null, UPLOADS_DIR);
        } catch (e) {
            cb(e);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Load data
const loadData = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch (error) {
        return getDefaultData();
    }
};

// Save data
const saveData = (data) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        // On Vercel, filesystem writes are ephemeral; fail gracefully.
    }
};

// Get default data structure
const getDefaultData = () => ({
    users: [
        {
            id: 1,
            username: 'admin',
            password: bcrypt.hashSync('admin123', 10), // Default password
            email: 'admin@punarjani.com'
        }
    ],
    hero: {
        heading: 'Empower your healing and harmony',
        description: 'Join us in transforming your body and mind through our comprehensive yoga and fitness programs.',
        ctaPrimary: 'Book now',
        ctaSecondary: 'Get your Direction',
        heroImage: 'assets/images/hero-bg-2b24fd.png'
    },
    stats: [
        { value: '1k', suffix: '+', label: 'Patients treated' },
        { value: '95', suffix: '%', label: 'Feel real pain relief' },
        { value: '3', suffix: '+', label: 'Expert therapies available' }
    ],
    statsDescription: 'Whether you\'re dealing with chronic pain, recovering from an injury, or simply looking to move more comfortably, our treatments are designed to relieve pain, restore mobility, and support your long‑term wellness.',
    services: [
        {
            id: 1,
            title: 'Electro Acupuncture',
            description: 'Targeted sessions using fine needles and gentle electrical stimulation to reduce pain, calm inflammation, and support faster recovery.',
            icon: 'assets/images/service-bg-1.svg'
        },
        {
            id: 2,
            title: 'Cupping Therapy',
            description: 'Personalized training programs tailored to your fitness goals. Focus on strength and flexibility.',
            icon: 'assets/images/service-bg-2.svg'
        },
        {
            id: 3,
            title: 'Manual Therapy',
            description: 'Explore workshops on mindfulness, stress relief, and holistic wellness. Suitable for all levels of experience.',
            icon: 'assets/images/service-bg-3.svg'
        }
    ],
    doctors: [
        {
            id: 1,
            name: 'Alicia Regis',
            image: 'assets/images/doctor-profile.png',
            specialization: 'Specialist Consultation',
            description: 'One-on-one sessions with our fitness and yoga experts. Get personalized guidance and encouragement to reach your specific goals.'
        }
    ],
    reviews: [
        {
            id: 1,
            name: 'Clare Bamford',
            username: '@staking',
            avatar: 'assets/images/review-1-56586a.png',
            text: 'My brother I can\'t thank you enough even if you say it\'s all me.',
            date: '22.03.2021'
        },
        {
            id: 2,
            name: 'Jamie Kokot',
            username: '@staking',
            avatar: 'assets/images/review-2-56586a.png',
            text: 'I started going to the gym but had no idea what I was doing.',
            date: '22.03.2021'
        },
        {
            id: 3,
            name: 'Clare Bamford',
            username: '@staking',
            avatar: 'assets/images/review-3-56586a.png',
            text: 'My brother I can\'t thank you enough even if you say it\'s all me.',
            date: '22.03.2021'
        },
        {
            id: 4,
            name: 'Clare Bamford',
            username: '@staking',
            avatar: 'assets/images/review-4-56586a.png',
            text: 'I started going to the gym but had no idea what I was doing.',
            date: '22.03.2021'
        },
        {
            id: 5,
            name: 'Clare Bamford',
            username: '@staking',
            avatar: 'assets/images/review-5-56586a.png',
            text: 'My brother I can\'t thank you enough even if you say it\'s all me.',
            date: '22.03.2021'
        }
    ],
    faqs: [
        {
            id: 1,
            question: 'What types of yoga classes do you offer?',
            answer: 'We offer various yoga styles including Hatha, Vinyasa, Yin, and Restorative yoga.'
        },
        {
            id: 2,
            question: 'Do I need any prior experience to join your fitness programs?',
            answer: 'No prior experience is needed. Our programs are designed for all fitness levels.'
        },
        {
            id: 3,
            question: 'How do I book a personalized coaching session?',
            answer: 'You can book a session through our website or by calling our reception.'
        },
        {
            id: 4,
            question: 'What should I bring to a yoga class?',
            answer: 'Bring comfortable clothing, a water bottle, and your own mat if you prefer.'
        },
        {
            id: 5,
            question: 'Are your nutritional plans tailored to individual needs?',
            answer: 'Yes, all our nutritional plans are customized based on your goals and dietary requirements.'
        },
        {
            id: 6,
            question: 'How often are wellness workshops held?',
            answer: 'Wellness workshops are held monthly. Check our events calendar for upcoming dates.'
        }
    ],
    contact: {
        phone: '(814) 413-9191',
        email: 'hello@harmoni.com'
    },
    servicesPage: {
        heroTitle: 'Our Services',
        heroDescription: 'We offer a wide range of evidence-based therapies to help you recover, heal and thrive.',
        conditionsTitle: 'Conditions We Treat',
        conditionsDescription: 'From chronic pain to post-injury recovery, our expert team provides targeted treatments for a wide range of musculoskeletal and neurological conditions.',
        whyChooseTitle: 'Why Choose Us',
        whyChooseDescription: 'Our multidisciplinary approach combines traditional wisdom with modern techniques to deliver lasting results for every patient.'
    },
    contactPage: {
        title: 'Contact Us',
        subtitle: "we're here to help! Whether you have questions, feedback, or need support, our team is ready to assist you.",
        address: '123 Wellness Street, Thrissur, Kerala',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.7!2d76.2!3d10.5'
    },
    siteSettings: {
        clinicName: 'Punarjani',
        footerTagline: 'Wellness & Healthcare'
    },
    headerVisibility: {
        menuIcon: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        logo: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        contactBtn: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true }
    },
    footerVisibility: {
        logo: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        contactCol: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        navCol1: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        navCol2: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        largeText: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true },
        scrollTop: { '1600': true, '1400': true, '1200': true, '1024': true, '768': true, '480': true }
    }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = loadData();

    const user = data.users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    });
});

// Get all content
app.get('/api/content', (req, res) => {
    const data = loadData();
    const { users, ...content } = data;
    res.json(content);
});

// Update Hero
app.put('/api/hero', authenticateToken, (req, res) => {
    const data = loadData();
    data.hero = { ...data.hero, ...req.body };
    saveData(data);
    res.json({ message: 'Hero updated successfully', hero: data.hero });
});

// Update Stats
app.put('/api/stats', authenticateToken, (req, res) => {
    const data = loadData();
    data.stats = req.body.stats;
    data.statsDescription = req.body.statsDescription;
    saveData(data);
    res.json({ message: 'Stats updated successfully' });
});

// Services CRUD
app.get('/api/services', (req, res) => {
    const data = loadData();
    res.json(data.services);
});

app.post('/api/services', authenticateToken, (req, res) => {
    const data = loadData();
    const newService = {
        id: Date.now(),
        ...req.body
    };
    data.services.push(newService);
    saveData(data);
    res.json({ message: 'Service added successfully', service: newService });
});

app.put('/api/services/:id', authenticateToken, (req, res) => {
    const data = loadData();
    const index = data.services.findIndex(s => s.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Service not found' });

    data.services[index] = { ...data.services[index], ...req.body };
    saveData(data);
    res.json({ message: 'Service updated successfully', service: data.services[index] });
});

app.delete('/api/services/:id', authenticateToken, (req, res) => {
    const data = loadData();
    data.services = data.services.filter(s => s.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ message: 'Service deleted successfully' });
});

// Doctors CRUD
app.get('/api/doctors', (req, res) => {
    const data = loadData();
    res.json(data.doctors);
});

app.post('/api/doctors', authenticateToken, (req, res) => {
    const data = loadData();
    const newDoctor = {
        id: Date.now(),
        ...req.body
    };
    data.doctors.push(newDoctor);
    saveData(data);
    res.json({ message: 'Doctor added successfully', doctor: newDoctor });
});

app.put('/api/doctors/:id', authenticateToken, (req, res) => {
    const data = loadData();
    const index = data.doctors.findIndex(d => d.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Doctor not found' });

    data.doctors[index] = { ...data.doctors[index], ...req.body };
    saveData(data);
    res.json({ message: 'Doctor updated successfully', doctor: data.doctors[index] });
});

app.delete('/api/doctors/:id', authenticateToken, (req, res) => {
    const data = loadData();
    data.doctors = data.doctors.filter(d => d.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ message: 'Doctor deleted successfully' });
});

// Reviews CRUD
app.get('/api/reviews', (req, res) => {
    const data = loadData();
    res.json(data.reviews);
});

app.post('/api/reviews', authenticateToken, (req, res) => {
    const data = loadData();
    const newReview = {
        id: Date.now(),
        ...req.body
    };
    data.reviews.push(newReview);
    saveData(data);
    res.json({ message: 'Review added successfully', review: newReview });
});

app.put('/api/reviews/:id', authenticateToken, (req, res) => {
    const data = loadData();
    const index = data.reviews.findIndex(r => r.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Review not found' });

    data.reviews[index] = { ...data.reviews[index], ...req.body };
    saveData(data);
    res.json({ message: 'Review updated successfully', review: data.reviews[index] });
});

app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
    const data = loadData();
    data.reviews = data.reviews.filter(r => r.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ message: 'Review deleted successfully' });
});

// FAQs CRUD
app.get('/api/faqs', (req, res) => {
    const data = loadData();
    res.json(data.faqs);
});

app.post('/api/faqs', authenticateToken, (req, res) => {
    const data = loadData();
    const newFaq = {
        id: Date.now(),
        ...req.body
    };
    data.faqs.push(newFaq);
    saveData(data);
    res.json({ message: 'FAQ added successfully', faq: newFaq });
});

app.put('/api/faqs/:id', authenticateToken, (req, res) => {
    const data = loadData();
    const index = data.faqs.findIndex(f => f.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'FAQ not found' });

    data.faqs[index] = { ...data.faqs[index], ...req.body };
    saveData(data);
    res.json({ message: 'FAQ updated successfully', faq: data.faqs[index] });
});

app.delete('/api/faqs/:id', authenticateToken, (req, res) => {
    const data = loadData();
    data.faqs = data.faqs.filter(f => f.id !== parseInt(req.params.id));
    saveData(data);
    res.json({ message: 'FAQ deleted successfully' });
});

// Contact Update
app.put('/api/contact', authenticateToken, (req, res) => {
    const data = loadData();
    data.contact = { ...data.contact, ...req.body };
    saveData(data);
    res.json({ message: 'Contact updated successfully', contact: data.contact });
});

// Services Page Content
app.put('/api/services-page', authenticateToken, (req, res) => {
    const data = loadData();
    if (!data.servicesPage) data.servicesPage = {};
    data.servicesPage = { ...data.servicesPage, ...req.body };
    saveData(data);
    res.json({ message: 'Services page updated successfully', servicesPage: data.servicesPage });
});

// Contact Page Content
app.put('/api/contact-page', authenticateToken, (req, res) => {
    const data = loadData();
    if (!data.contactPage) data.contactPage = {};
    data.contactPage = { ...data.contactPage, ...req.body };
    saveData(data);
    res.json({ message: 'Contact page updated successfully', contactPage: data.contactPage });
});

// Site Settings
app.put('/api/site-settings', authenticateToken, (req, res) => {
    const data = loadData();
    if (!data.siteSettings) data.siteSettings = {};
    data.siteSettings = { ...data.siteSettings, ...req.body };
    saveData(data);
    res.json({ message: 'Site settings updated successfully', siteSettings: data.siteSettings });
});

// Header Visibility
app.put('/api/header-visibility', authenticateToken, (req, res) => {
    const data = loadData();
    data.headerVisibility = req.body;
    saveData(data);
    res.json({ message: 'Header visibility updated successfully', headerVisibility: data.headerVisibility });
});

// Footer Visibility
app.put('/api/footer-visibility', authenticateToken, (req, res) => {
    const data = loadData();
    data.footerVisibility = req.body;
    saveData(data);
    res.json({ message: 'Footer visibility updated successfully', footerVisibility: data.footerVisibility });
});

// File Upload
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        path: '/uploads/' + req.file.filename
    });
});

// Admin routes
app.get('/admin', (req, res) => {
    res.redirect('/admin-login.html');
});

app.get('/admin/dashboard', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Initialize data file if it doesn't exist
try {
    if (!fs.existsSync(DATA_PATH)) {
        saveData(getDefaultData());
    }
} catch (e) {
    // ignore
}

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
        console.log(`Default credentials: username: admin, password: admin123`);
    });
}
