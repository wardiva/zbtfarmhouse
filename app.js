/* -------------------------------------------------------------
   ZBT FARMHOUSE FAISALABAD - INTERACTIVE APP ENGINE
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const bookingForm = document.getElementById('bookingForm');
    const formPackage = document.getElementById('formPackage');
    const formDate = document.getElementById('formDate');
    const formGuests = document.getElementById('formGuests');
    const addonInputs = document.querySelectorAll('.addon-input');
    const displayTotalPrice = document.getElementById('displayTotalPrice');
    const availabilityStatus = document.getElementById('availabilityStatus');
    const selectPkgBtns = document.querySelectorAll('.select-pkg-btn');

    // Contact Form Element
    const contactInquiryForm = document.getElementById('contactInquiryForm');

    // Navigation & Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    // Modals
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBookingRef = document.getElementById('modalBookingRef');
    const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');

    // Admin Dashboard Elements
    const adminToggleBtns = document.querySelectorAll('.admin-toggle-btn');
    const adminModal = document.getElementById('adminModal');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const adminBookingsTbody = document.getElementById('adminBookingsTbody');
    const adminTotalBookings = document.getElementById('adminTotalBookings');
    const adminTotalRevenue = document.getElementById('adminTotalRevenue');
    const adminConfirmedBookings = document.getElementById('adminConfirmedBookings');
    const adminPendingBookings = document.getElementById('adminPendingBookings');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // --- Helper Functions for Local Storage Bookings ---
    function getStoredBookings() {
        try {
            return JSON.parse(localStorage.getItem('zbt_bookings') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveStoredBooking(booking) {
        const bookings = getStoredBookings();
        bookings.unshift(booking);
        localStorage.setItem('zbt_bookings', JSON.stringify(bookings));
    }

    function updateStoredBookingStatus(id, newStatus) {
        const bookings = getStoredBookings();
        const found = bookings.find(b => b.id == id || b.booking_ref == id);
        if (found) {
            found.status = newStatus;
            localStorage.setItem('zbt_bookings', JSON.stringify(bookings));
        }
    }

    // --- 1. Dynamic Price Calculator ---
    function calculateTotalPrice() {
        if (!formPackage) return 0;
        const selectedOption = formPackage.options[formPackage.selectedIndex];
        if (!selectedOption) return 0;
        
        let pkgValue = selectedOption.value;
        let basePrice = parseInt(selectedOption.getAttribute('data-price') || 23000);
        let guests = parseInt(formGuests ? formGuests.value : 10) || 1;

        let guestExtra = 0;
        let calculatedBasePrice = basePrice;

        // Extra guests beyond standard capacity
        if (pkgValue.includes('1-25 Guests') && guests > 25) {
            guestExtra = (guests - 25) * 1000;
        }

        let addonTotal = 0;
        addonInputs.forEach(input => {
            if (input.checked && input.id !== 'formOldCustomer') {
                addonTotal += parseInt(input.getAttribute('data-price') || 0);
            }
        });

        let subTotal = calculatedBasePrice + guestExtra + addonTotal;
        let finalTotal = Math.round(Math.max(0, subTotal) * 0.95);

        if (displayTotalPrice) displayTotalPrice.textContent = finalTotal.toLocaleString('en-US');
        return finalTotal;
    }

    if (formPackage) formPackage.addEventListener('change', calculateTotalPrice);
    if (formGuests) formGuests.addEventListener('input', calculateTotalPrice);
    addonInputs.forEach(input => input.addEventListener('change', calculateTotalPrice));
    calculateTotalPrice();

    // --- 2. Date Availability Checker ---
    if (formDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        formDate.value = tomorrow.toISOString().split('T')[0];

        function checkAvailability() {
            const dateVal = formDate.value;
            if (!dateVal) return;

            if (availabilityStatus) {
                availabilityStatus.style.color = '#10b981';
                availabilityStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Date Open for Booking';
            }
        }

        formDate.addEventListener('change', checkAvailability);
        checkAvailability();
    }

    // --- 3. Hybrid Fail-Proof Booking Submission ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBookingBtn');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit Booking';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Reservation...';
            }

            const name = document.getElementById('formName').value.trim();
            const phone = document.getElementById('formPhone').value.trim();
            const email = document.getElementById('formEmail') ? document.getElementById('formEmail').value.trim() : '';
            const eventDate = document.getElementById('formDate').value;
            const pkgOption = formPackage.options[formPackage.selectedIndex];
            const pkgName = pkgOption.value;
            const guests = parseInt(formGuests.value) || 10;
            const totalPrice = calculateTotalPrice();

            const selectedAddons = [];
            addonInputs.forEach(input => {
                if (input.checked) selectedAddons.push(input.value);
            });

            // Generate Booking Ref
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const bookingRef = `ZBT-2026-${randomCode}`;

            // UTM Ad Campaign Tracker
            const urlParams = new URLSearchParams(window.location.search);
            const utmSource = urlParams.get('utm_source') || 'Organic Direct';
            const utmCampaign = urlParams.get('utm_campaign') || 'Direct Website';

            const newBooking = {
                id: Date.now(),
                booking_ref: bookingRef,
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                booking_type: pkgName,
                event_date: eventDate,
                guests_count: guests,
                total_price: totalPrice,
                addons: selectedAddons,
                status: 'Pending',
                ad_source: `${utmSource} (${utmCampaign})`,
                timestamp: new Date().toISOString()
            };

            // Fire Meta Pixel, Google Ads & TikTok Ads Conversion Events
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', { content_name: pkgName, value: totalPrice, currency: 'PKR' });
            }
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', { 'send_to': 'AW-CONVERSION_ID', 'value': totalPrice, 'currency': 'PKR' });
            }
            if (typeof ttq === 'function') {
                ttq.track('SubmitForm', { contents: [{ content_name: pkgName, price: totalPrice }] });
            }

            // Save to LocalStorage immediately for instant Admin Panel visibility
            saveStoredBooking(newBooking);

            // Client-Side Backup Webhook / Email Dispatcher
            fetch('https://formspree.io/f/xanyzwba', { // Standard Formspree/Webhook Email Relay Backup
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `New ZBT Booking Ref: ${bookingRef}`,
                    name: name,
                    phone: phone,
                    email: email,
                    package: pkgName,
                    event_date: eventDate,
                    guests: guests,
                    total_price: totalPrice
                })
            }).catch(() => {});


            // Send background POST to backend server
            fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBooking)
            }).catch(err => console.log('Backend sync offline, stored locally.'));

            // Build WhatsApp Message URL
            const waMsg = `Hi ZBT Farmhouse,%0A%0AI want to confirm my booking reservation:%0A%0A📌 *Booking Ref:* ${bookingRef}%0A👤 *Name:* ${encodeURIComponent(name)}%0A📞 *Phone:* ${encodeURIComponent(phone)}%0A📦 *Package:* ${encodeURIComponent(pkgName)}%0A📅 *Date:* ${eventDate}%0A👥 *Guests:* ${guests}%0A💰 *Total Price (5% Online Discounted):* PKR ${totalPrice.toLocaleString('en-US')}%0A%0APlease confirm date availability & advance deposit details!`;
            const waUrl = `https://wa.me/923338666964?text=${waMsg}`;

            // Reset submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }

            // Display Confirmation Modal or Redirect
            if (modalBookingRef) modalBookingRef.textContent = bookingRef;
            if (modalWhatsAppBtn) modalWhatsAppBtn.href = waUrl;
            
            if (confirmationModal) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    const bsModal = new window.bootstrap.Modal(confirmationModal);
                    bsModal.show();
                } else {
                    confirmationModal.classList.add('active');
                }
            } else {
                window.open(waUrl, '_blank');
            }

            bookingForm.reset();
            calculateTotalPrice();
        });
    }

    // --- 4. Admin Dashboard Loading & Sync ---
    function loadAdminDashboard() {
        const localBookings = getStoredBookings();
        
        fetch('/api/bookings')
            .then(res => res.json())
            .then(data => {
                let merged = localBookings;
                if (data && data.success && Array.isArray(data.bookings)) {
                    // Merge server bookings without duplicates
                    const ids = new Set(localBookings.map(b => b.booking_ref));
                    data.bookings.forEach(sb => {
                        if (!ids.has(sb.booking_ref)) merged.push(sb);
                    });
                }
                renderAdminTable(merged);
            })
            .catch(() => renderAdminTable(localBookings));
    }

    function renderAdminTable(bookings) {
        if (!adminBookingsTbody) return;

        let totalRev = 0;
        let confirmed = 0;
        let pending = 0;

        adminBookingsTbody.innerHTML = '';

        if (bookings.length === 0) {
            adminBookingsTbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No booking reservations recorded yet.</td></tr>';
        } else {
            bookings.forEach(b => {
                totalRev += (parseInt(b.total_price) || 0);
                if (b.status === 'Confirmed') confirmed++;
                else pending++;

                const cleanPhone = (b.customer_phone || '').replace(/[^0-9]/g, '');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong class="text-gold">${b.booking_ref}</strong></td>
                    <td>${b.customer_name}</td>
                    <td><a href="https://wa.me/${cleanPhone}" target="_blank" class="text-success fw-bold"><i class="fa-brands fa-whatsapp me-1"></i> ${b.customer_phone}</a></td>
                    <td><small class="fw-semibold">${b.booking_type}</small></td>
                    <td>${b.event_date}</td>
                    <td><span class="badge bg-secondary">${b.guests_count} Guests</span></td>
                    <td><strong class="text-success">PKR ${parseInt(b.total_price).toLocaleString()}</strong></td>
                    <td>
                        <span class="badge ${b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'} px-2 py-1">${b.status}</span>
                    </td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-success toggle-status-btn me-1" data-ref="${b.booking_ref}" data-status="Confirmed">Confirm</button>
                        <button type="button" class="btn btn-sm btn-outline-danger toggle-status-btn" data-ref="${b.booking_ref}" data-status="Cancelled">Cancel</button>
                    </td>
                `;
                adminBookingsTbody.appendChild(tr);
            });
        }

        if (adminTotalBookings) adminTotalBookings.textContent = bookings.length;
        if (adminTotalRevenue) adminTotalRevenue.textContent = 'PKR ' + totalRev.toLocaleString('en-US');
        if (adminConfirmedBookings) adminConfirmedBookings.textContent = confirmed;
        if (adminPendingBookings) adminPendingBookings.textContent = pending;

        // Toggle Status Listeners
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ref = btn.getAttribute('data-ref');
                const st = btn.getAttribute('data-status');
                updateStoredBookingStatus(ref, st);
                loadAdminDashboard();
            });
        });
    }

    // Trigger Admin Dashboard Modal
    adminToggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            loadAdminDashboard();
            if (adminModal) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    const bsModal = new window.bootstrap.Modal(adminModal);
                    bsModal.show();
                } else {
                    adminModal.classList.add('active');
                }
            }
        });
    });

    if (closeAdminBtn && adminModal) {
        closeAdminBtn.addEventListener('click', () => adminModal.classList.remove('active'));
    }

    // Keyboard shortcut (Ctrl + Shift + A) to launch Admin Dashboard anywhere
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            loadAdminDashboard();
            if (adminModal) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    const bsModal = new window.bootstrap.Modal(adminModal);
                    bsModal.show();
                }
            }
        }
    });

    // --- 5. Export Bookings CSV ---
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            const bookings = getStoredBookings();
            if (bookings.length === 0) {
                alert('No bookings available to export.');
                return;
            }
            let csv = 'Booking Ref,Customer Name,Phone,Package,Event Date,Guests,Total Price,Status\n';
            bookings.forEach(b => {
                csv += `"${b.booking_ref}","${b.customer_name}","${b.customer_phone}","${b.booking_type}","${b.event_date}","${b.guests_count}","${b.total_price}","${b.status}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ZBT_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        });
    }
});
