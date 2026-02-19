const API_URL = 'http://localhost:4500/api';
let currentContent = {};

// Check authentication
const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
        return null;
    }
    return token;
};

// Get headers with auth token
const getHeaders = () => {
    const token = checkAuth();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Show toast notification
const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// Load user info
const loadUserInfo = () => {
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    document.getElementById('userName').textContent = user.username || 'Admin';
    document.getElementById('userEmail').textContent = user.email || '';
    document.querySelector('.user-avatar').textContent = (user.username || 'A')[0].toUpperCase();
};

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show corresponding section
        const section = item.dataset.section;
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');
    });
});

// Load all content
const loadContent = async () => {
    try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        currentContent = data;

        loadHero(data.hero);
        loadStats(data.stats, data.statsDescription);
        loadServices(data.services);
        loadDoctors(data.doctors);
        loadReviews(data.reviews);
        loadFaqs(data.faqs);
        loadContact(data.contact);
        loadServicesPage(data.servicesPage || {});
        loadContactPage(data.contactPage || {});
        loadSiteSettings(data.siteSettings || {});
        loadHeaderVisibility(data.headerVisibility || {});
        loadFooterVisibility(data.footerVisibility || {});
    } catch (error) {
        console.error('Error loading content:', error);
        showToast('Error loading content', 'error');
    }
};

// Hero Section
const loadHero = (hero) => {
    const form = document.getElementById('heroForm');
    form.heading.value = hero.heading;
    form.description.value = hero.description;
    form.ctaPrimary.value = hero.ctaPrimary;
    form.ctaSecondary.value = hero.ctaSecondary;

    // Load hero image preview
    const img = document.getElementById('heroImagePreviewImg');
    const placeholder = document.getElementById('heroImagePreviewPlaceholder');
    const urlInput = document.getElementById('heroImageUrlInput');
    if (hero.heroImage) {
        if (img) {
            img.src = hero.heroImage;
            img.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (urlInput) urlInput.value = hero.heroImage;
    } else {
        if (img) img.style.display = 'none';
        if (placeholder) { placeholder.style.display = 'block'; placeholder.textContent = 'No image set'; }
    }
};

// Helper: save heroImage path via /api/hero
const saveHeroImage = async (imagePath) => {
    const response = await fetch(`${API_URL}/hero`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ heroImage: imagePath })
    });
    if (!response.ok) throw new Error('Failed to save hero image');
    return imagePath;
};

// Helper: update preview in the admin panel
const updateHeroImagePreview = (src) => {
    const img = document.getElementById('heroImagePreviewImg');
    const placeholder = document.getElementById('heroImagePreviewPlaceholder');
    const urlInput = document.getElementById('heroImageUrlInput');
    if (img) { img.src = src; img.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (urlInput) urlInput.value = src;
};

// Hero image upload zone
const setupHeroImageUpload = () => {
    const zone = document.getElementById('heroUploadZone');
    const fileInput = document.getElementById('heroImageFileInput');
    const browseBtn = document.getElementById('heroUploadBrowseBtn');

    if (!zone || !fileInput || !browseBtn) return;

    // Browse button triggers file input
    browseBtn.addEventListener('click', () => fileInput.click());
    zone.addEventListener('click', (e) => { if (e.target !== browseBtn) fileInput.click(); });

    // Drag-and-drop visual feedback
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) uploadHeroImageFile(file);
    });

    // File input change
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) uploadHeroImageFile(file);
    });
};

// Upload a file and store its path
const uploadHeroImageFile = async (file) => {
    const zone = document.getElementById('heroUploadZone');
    zone.classList.add('uploading');
    const titleEl = zone.querySelector('.hero-upload-title');
    const originalTitle = titleEl.textContent;
    titleEl.textContent = 'Uploading...';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
            body: formData
        });

        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        const imagePath = uploadData.path; // e.g. "/uploads/hero-bg-1234567.png"

        await saveHeroImage(imagePath);
        updateHeroImagePreview(imagePath);
        showToast('Hero image updated successfully!');
    } catch (err) {
        showToast('Error uploading image', 'error');
    } finally {
        zone.classList.remove('uploading');
        titleEl.textContent = originalTitle;
    }
};

// URL form submit
document.getElementById('heroImageUrlForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('heroImageUrlInput');
    const imagePath = urlInput.value.trim();
    if (!imagePath) return;

    try {
        await saveHeroImage(imagePath);
        updateHeroImagePreview(imagePath);
        showToast('Hero image URL saved successfully!');
    } catch (err) {
        showToast('Error saving image URL', 'error');
    }
});

// Initialize hero image upload zone on page load
setupHeroImageUpload();

document.getElementById('heroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/hero`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Hero section updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating hero section', 'error');
    }
});

// Stats Section
const loadStats = (stats, description) => {
    const container = document.getElementById('statsContainer');
    container.innerHTML = stats.map((stat, index) => `
        <div class="stat-group">
            <div class="stat-group-title">Stat ${index + 1}</div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Value</label>
                    <input type="text" name="stat-${index}-value" class="form-input" value="${stat.value}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Suffix (+, %, etc.)</label>
                    <input type="text" name="stat-${index}-suffix" class="form-input" value="${stat.suffix}" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Label</label>
                <input type="text" name="stat-${index}-label" class="form-input" value="${stat.label}" required>
            </div>
        </div>
    `).join('');

    document.querySelector('[name="statsDescription"]').value = description;
};

document.getElementById('statsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const stats = [];
    for (let i = 0; i < 3; i++) {
        stats.push({
            value: formData.get(`stat-${i}-value`),
            suffix: formData.get(`stat-${i}-suffix`),
            label: formData.get(`stat-${i}-label`)
        });
    }

    const data = {
        stats,
        statsDescription: formData.get('statsDescription')
    };

    try {
        const response = await fetch(`${API_URL}/stats`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Statistics updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating statistics', 'error');
    }
});

// Services Section
const loadServices = (services) => {
    const container = document.getElementById('servicesContainer');
    container.innerHTML = services.map(service => `
        <div class="item-card">
            <img src="${service.icon}" alt="${service.title}" class="item-card-image">
            <h3 class="item-card-title">${service.title}</h3>
            <p class="item-card-text">${service.description}</p>
            <div class="item-card-actions">
                <button class="btn-edit" onclick="editService(${service.id})">Edit</button>
                <button class="btn-delete" onclick="deleteService(${service.id})">Delete</button>
            </div>
        </div>
    `).join('');
};

document.getElementById('addServiceBtn').addEventListener('click', () => {
    showModal('Add Service', `
        <form id="serviceForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Icon URL</label>
                <input type="text" name="icon" class="form-input" placeholder="assets/images/service-bg-1.svg" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Add Service</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/services`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Service added successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to add service');
            }
        } catch (error) {
            showToast('Error adding service', 'error');
        }
    });
});

window.editService = (id) => {
    const service = currentContent.services.find(s => s.id === id);
    if (!service) return;

    showModal('Edit Service', `
        <form id="serviceForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-input" value="${service.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4" required>${service.description}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Icon URL</label>
                <input type="text" name="icon" class="form-input" value="${service.icon}" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Update Service</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/services/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Service updated successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to update service');
            }
        } catch (error) {
            showToast('Error updating service', 'error');
        }
    });
};

window.deleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
        const response = await fetch(`${API_URL}/services/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showToast('Service deleted successfully!');
            loadContent();
        } else {
            throw new Error('Failed to delete service');
        }
    } catch (error) {
        showToast('Error deleting service', 'error');
    }
};

// Doctors Section
const loadDoctors = (doctors) => {
    const container = document.getElementById('doctorsContainer');
    container.innerHTML = doctors.map(doctor => `
        <div class="item-card">
            <img src="${doctor.image}" alt="${doctor.name}" class="item-card-image">
            <h3 class="item-card-title">${doctor.name}</h3>
            <p class="item-card-text"><strong>${doctor.specialization}</strong></p>
            <p class="item-card-text">${doctor.description}</p>
            <div class="item-card-actions">
                <button class="btn-edit" onclick="editDoctor(${doctor.id})">Edit</button>
                <button class="btn-delete" onclick="deleteDoctor(${doctor.id})">Delete</button>
            </div>
        </div>
    `).join('');
};

document.getElementById('addDoctorBtn').addEventListener('click', () => {
    showModal('Add Doctor', `
        <form id="doctorForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Specialization</label>
                <input type="text" name="specialization" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Image URL</label>
                <input type="text" name="image" class="form-input" placeholder="assets/images/doctor-profile.png" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Add Doctor</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/doctors`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Doctor added successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to add doctor');
            }
        } catch (error) {
            showToast('Error adding doctor', 'error');
        }
    });
});

window.editDoctor = (id) => {
    const doctor = currentContent.doctors.find(d => d.id === id);
    if (!doctor) return;

    showModal('Edit Doctor', `
        <form id="doctorForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-input" value="${doctor.name}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Specialization</label>
                <input type="text" name="specialization" class="form-input" value="${doctor.specialization}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4" required>${doctor.description}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Image URL</label>
                <input type="text" name="image" class="form-input" value="${doctor.image}" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Update Doctor</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/doctors/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Doctor updated successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to update doctor');
            }
        } catch (error) {
            showToast('Error updating doctor', 'error');
        }
    });
};

window.deleteDoctor = async (id) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
        const response = await fetch(`${API_URL}/doctors/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showToast('Doctor deleted successfully!');
            loadContent();
        } else {
            throw new Error('Failed to delete doctor');
        }
    } catch (error) {
        showToast('Error deleting doctor', 'error');
    }
};

// Reviews Section
const loadReviews = (reviews) => {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = reviews.map(review => `
        <div class="item-card">
            <img src="${review.avatar}" alt="${review.name}" class="item-card-image">
            <h3 class="item-card-title">${review.name}</h3>
            <p class="item-card-text">${review.username}</p>
            <p class="item-card-text">"${review.text}"</p>
            <p class="item-card-text"><small>${review.date}</small></p>
            <div class="item-card-actions">
                <button class="btn-edit" onclick="editReview(${review.id})">Edit</button>
                <button class="btn-delete" onclick="deleteReview(${review.id})">Delete</button>
            </div>
        </div>
    `).join('');
};

document.getElementById('addReviewBtn').addEventListener('click', () => {
    showModal('Add Review', `
        <form id="reviewForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-input" placeholder="@username" required>
            </div>
            <div class="form-group">
                <label class="form-label">Review Text</label>
                <textarea name="text" class="form-textarea" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="text" name="date" class="form-input" placeholder="22.03.2021" required>
            </div>
            <div class="form-group">
                <label class="form-label">Avatar URL</label>
                <input type="text" name="avatar" class="form-input" placeholder="assets/images/review-1-56586a.png" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Add Review</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Review added successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to add review');
            }
        } catch (error) {
            showToast('Error adding review', 'error');
        }
    });
});

window.editReview = (id) => {
    const review = currentContent.reviews.find(r => r.id === id);
    if (!review) return;

    showModal('Edit Review', `
        <form id="reviewForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-input" value="${review.name}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-input" value="${review.username}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Review Text</label>
                <textarea name="text" class="form-textarea" rows="3" required>${review.text}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Date</label>
                <input type="text" name="date" class="form-input" value="${review.date}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Avatar URL</label>
                <input type="text" name="avatar" class="form-input" value="${review.avatar}" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Update Review</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/reviews/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('Review updated successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to update review');
            }
        } catch (error) {
            showToast('Error updating review', 'error');
        }
    });
};

window.deleteReview = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const response = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showToast('Review deleted successfully!');
            loadContent();
        } else {
            throw new Error('Failed to delete review');
        }
    } catch (error) {
        showToast('Error deleting review', 'error');
    }
};

// FAQs Section
const loadFaqs = (faqs) => {
    const container = document.getElementById('faqsContainer');
    container.innerHTML = faqs.map(faq => `
        <div class="faq-item">
            <div class="faq-content">
                <h4 class="faq-question">${faq.question}</h4>
                <p class="faq-answer">${faq.answer}</p>
            </div>
            <div class="item-card-actions">
                <button class="btn-edit" onclick="editFaq(${faq.id})">Edit</button>
                <button class="btn-delete" onclick="deleteFaq(${faq.id})">Delete</button>
            </div>
        </div>
    `).join('');
};

document.getElementById('addFaqBtn').addEventListener('click', () => {
    showModal('Add FAQ', `
        <form id="faqForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Question</label>
                <input type="text" name="question" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Answer</label>
                <textarea name="answer" class="form-textarea" rows="4" required></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Add FAQ</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/faqs`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('FAQ added successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to add FAQ');
            }
        } catch (error) {
            showToast('Error adding FAQ', 'error');
        }
    });
});

window.editFaq = (id) => {
    const faq = currentContent.faqs.find(f => f.id === id);
    if (!faq) return;

    showModal('Edit FAQ', `
        <form id="faqForm" class="content-form">
            <div class="form-group">
                <label class="form-label">Question</label>
                <input type="text" name="question" class="form-input" value="${faq.question}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Answer</label>
                <textarea name="answer" class="form-textarea" rows="4" required>${faq.answer}</textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Update FAQ</button>
            </div>
        </form>
    `, async (formData) => {
        try {
            const response = await fetch(`${API_URL}/faqs/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                showToast('FAQ updated successfully!');
                closeModal();
                loadContent();
            } else {
                throw new Error('Failed to update FAQ');
            }
        } catch (error) {
            showToast('Error updating FAQ', 'error');
        }
    });
};

window.deleteFaq = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
        const response = await fetch(`${API_URL}/faqs/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok) {
            showToast('FAQ deleted successfully!');
            loadContent();
        } else {
            throw new Error('Failed to delete FAQ');
        }
    } catch (error) {
        showToast('Error deleting FAQ', 'error');
    }
};

// Contact Section
const loadContact = (contact) => {
    const form = document.getElementById('contactForm');
    form.phone.value = contact.phone;
    form.email.value = contact.email;
};

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/contact`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Contact information updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating contact information', 'error');
    }
});

// Modal Functions
const showModal = (title, content, onSubmit) => {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    modal.classList.add('show');

    if (onSubmit) {
        const form = document.getElementById('modalBody').querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                onSubmit(formData);
            });
        }
    }
};

const closeModal = () => {
    document.getElementById('modal').classList.remove('show');
};

document.getElementById('modalClose').addEventListener('click', closeModal);

document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

// ============================================================
// Services Page Section
// ============================================================
const loadServicesPage = (sp) => {
    const form = document.getElementById('servicesPageForm');
    if (!form) return;
    form.heroTitle.value = sp.heroTitle || '';
    form.heroDescription.value = sp.heroDescription || '';
    form.conditionsTitle.value = sp.conditionsTitle || '';
    form.conditionsDescription.value = sp.conditionsDescription || '';
    form.whyChooseTitle.value = sp.whyChooseTitle || '';
    form.whyChooseDescription.value = sp.whyChooseDescription || '';
};

document.getElementById('servicesPageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/services-page`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Services page updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating services page', 'error');
    }
});

// ============================================================
// Contact Page Section
// ============================================================
const loadContactPage = (cp) => {
    const form = document.getElementById('contactPageForm');
    if (!form) return;
    form.title.value = cp.title || '';
    form.subtitle.value = cp.subtitle || '';
    form.address.value = cp.address || '';
    form.mapEmbedUrl.value = cp.mapEmbedUrl || '';
};

document.getElementById('contactPageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/contact-page`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Contact page updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating contact page', 'error');
    }
});

// ============================================================
// Site Settings Section
// ============================================================
const loadSiteSettings = (ss) => {
    const form = document.getElementById('siteSettingsForm');
    if (!form) return;
    form.clinicName.value = ss.clinicName || '';
    form.footerTagline.value = ss.footerTagline || '';
};

document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/site-settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Site settings updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating site settings', 'error');
    }
});

// ============================================================
// Header Visibility Section
// ============================================================
const BREAKPOINTS = ['1600', '1400', '1200', '1024', '768', '480'];

const loadHeaderVisibility = (hv) => {
    const table = document.getElementById('headerVisibilityTable');
    if (!table) return;
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const el = cb.dataset.element;
        const bp = cb.dataset.breakpoint;
        cb.checked = hv[el] ? hv[el][bp] !== false : true;
    });
};

document.getElementById('saveHeaderVisibility').addEventListener('click', async () => {
    const table = document.getElementById('headerVisibilityTable');
    const result = {};
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const el = cb.dataset.element;
        const bp = cb.dataset.breakpoint;
        if (!result[el]) result[el] = {};
        result[el][bp] = cb.checked;
    });

    try {
        const response = await fetch(`${API_URL}/header-visibility`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(result)
        });
        if (response.ok) {
            showToast('Header visibility updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating header visibility', 'error');
    }
});

// ============================================================
// Footer Visibility Section
// ============================================================
const loadFooterVisibility = (fv) => {
    const table = document.getElementById('footerVisibilityTable');
    if (!table) return;
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const el = cb.dataset.element;
        const bp = cb.dataset.breakpoint;
        cb.checked = fv[el] ? fv[el][bp] !== false : true;
    });
};

document.getElementById('saveFooterVisibility').addEventListener('click', async () => {
    const table = document.getElementById('footerVisibilityTable');
    const result = {};
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const el = cb.dataset.element;
        const bp = cb.dataset.breakpoint;
        if (!result[el]) result[el] = {};
        result[el][bp] = cb.checked;
    });

    try {
        const response = await fetch(`${API_URL}/footer-visibility`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(result)
        });
        if (response.ok) {
            showToast('Footer visibility updated successfully!');
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        showToast('Error updating footer visibility', 'error');
    }
});

// Initialize
checkAuth();
loadUserInfo();
loadContent();
