document.addEventListener("DOMContentLoaded", function () {
    // ===== CHECKBOX AMAL (localStorage) & RESET HARIAN =====
    const checkboxes = document.querySelectorAll(".amal-checkbox");
    
    // Dapatkan tanggal hari ini (format: YYYY-MM-DD) berdasarkan timezone lokal
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayDateString();
    const lastCheckedDate = localStorage.getItem("amal_last_checked_date");

    // Jika hari berganti (tanggal berbeda), reset seluruh amal
    if (lastCheckedDate !== todayStr) {
        checkboxes.forEach(function (checkbox) {
            localStorage.setItem(checkbox.id, "false");
            checkbox.checked = false;
        });
        localStorage.setItem("amal_last_checked_date", todayStr);
    }

    // Fungsi memperbarui visual progress bar
    function updateAmalProgress() {
        const total = checkboxes.length;
        if (total === 0) return;
        
        let checkedCount = 0;
        checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) checkedCount++;
        });

        const percentage = Math.round((checkedCount / total) * 100);
        
        const progressBadge = document.getElementById("amalProgressBadge");
        const progressFill = document.getElementById("amalProgressFill");
        const progressContainer = document.querySelector(".amal-progress-container");

        if (progressBadge) {
            if (percentage === 100) {
                progressBadge.textContent = "Masya Allah! 🌟";
            } else {
                progressBadge.textContent = `${checkedCount}/${total} Selesai`;
            }
        }
        
        if (progressFill) {
            progressFill.style.width = percentage + "%";
            if (percentage === 100) {
                progressFill.classList.add("complete");
            } else {
                progressFill.classList.remove("complete");
            }
        }
    }

    // Pasang status awal & event listener
    checkboxes.forEach(function (checkbox) {
        const savedStatus = localStorage.getItem(checkbox.id);
        const parentItem = checkbox.closest(".amal-item");
        
        if (savedStatus === "true") { 
            checkbox.checked = true; 
            if (parentItem) parentItem.classList.add("checked");
        } else {
            checkbox.checked = false;
            if (parentItem) parentItem.classList.remove("checked");
        }

        checkbox.addEventListener("change", function () {
            localStorage.setItem(checkbox.id, checkbox.checked);
            if (parentItem) parentItem.classList.toggle("checked", checkbox.checked);
            updateAmalProgress();
        });
    });

    // Inisialisasi progress bar saat pertama dimuat
    updateAmalProgress();


    // ===== JADWAL SHOLAT SUKOHARJO (INTEGRASI API & CACHING) =====
    // Default static data sebagai fallback offline
    let jadwalSholat = [
        { nama: "Subuh",     namaEn: "Fajr",    jam: "04:31" },
        { nama: "Dzuhur",    namaEn: "Dhuhr",   jam: "11:38" },
        { nama: "Ashar",     namaEn: "Asr",     jam: "14:57" },
        { nama: "Maghrib",   namaEn: "Maghrib", jam: "17:37" },
        { nama: "Isya",      namaEn: "Isha",    jam: "18:47" }
    ];

    const sholatTitleEl = document.querySelector(".sholat-title");
    const jamEl = document.querySelectorAll(".countdown-item .time-digit");
    const labelEl = document.querySelectorAll(".countdown-item .time-label");

    // Fungsi memperbarui UI Tabel Jadwal Lengkap di HTML
    function updateScheduleTableUI(timings) {
        const mapping = {
            subuh: timings.Fajr,
            terbit: timings.Sunrise,
            dzuhur: timings.Dhuhr,
            ashar: timings.Asr,
            maghrib: timings.Maghrib,
            isya: timings.Isha
        };

        for (const [key, val] of Object.entries(mapping)) {
            if (!val) continue;
            const cleanTime = val.split(" ")[0]; // hilangkan zona waktu jika ada
            const item = document.querySelector(`.jadwal-item[data-sholat="${key}"]`);
            if (item) {
                const jamWaktuEl = item.querySelector(".waktu-jam");
                if (jamWaktuEl) jamWaktuEl.textContent = cleanTime;
            }
        }
    }

    // Fungsi memperbarui array jadwalSholat dari data API
    function updateJadwalSholatArray(timings) {
        jadwalSholat = [
            { nama: "Subuh",     namaEn: "Fajr",    jam: timings.Fajr.split(" ")[0] },
            { nama: "Dzuhur",    namaEn: "Dhuhr",   jam: timings.Dhuhr.split(" ")[0] },
            { nama: "Ashar",     namaEn: "Asr",     jam: timings.Asr.split(" ")[0] },
            { nama: "Maghrib",   namaEn: "Maghrib", jam: timings.Maghrib.split(" ")[0] },
            { nama: "Isya",      namaEn: "Isha",    jam: timings.Isha.split(" ")[0] }
        ];
    }

    // ===== KALENDER HIJRIAH (Konversi Lokal + API Override) =====

    // Konversi tanggal Gregorian ke Hijriah menggunakan algoritma Tabular (akurasi ±1 hari)
    function getLocalHijriDate(inputDate) {
        const d = inputDate || new Date();
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();

        // Hitung Julian Day Number (JDN)
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

        // Konversi JDN ke Hijriah
        let l = jdn - 1948440 + 10632;
        const n = Math.floor((l - 1) / 10631);
        l = l - 10631 * n + 354;
        const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
        l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        
        const hijriMonth = Math.floor((24 * l) / 709);
        const hijriDay   = l - Math.floor((709 * hijriMonth) / 24);
        const hijriYear  = 30 * n + j - 30;

        const monthNames = [
            "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
            "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
            "Ramadhan", "Syawal", "Dzulqadah", "Dzulhijjah"
        ];

        return {
            day:       Math.max(1, hijriDay),
            monthName: monthNames[(hijriMonth - 1) % 12] || "Muharram",
            year:      hijriYear,
            monthIndex: hijriMonth
        };
    }

    // Tanggal Masehi dalam Bahasa Indonesia
    function getIndonesianGregorianDate() {
        const today = new Date();
        const days   = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
        const months = ["Januari","Februari","Maret","April","Mei","Juni",
                        "Juli","Agustus","September","Oktober","November","Desember"];
        return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    }

    // Terjemahkan nama bulan API ke Bahasa Indonesia
    function getCleanHijriMonth(monthEn) {
        const map = {
            "Muharram":"Muharram","Safar":"Safar",
            "Rabi' al-awwal":"Rabiul Awal","Rabi' al-awwal":"Rabiul Awal",
            "Rabi' ath-thani":"Rabiul Akhir","Rabi al-thani":"Rabiul Akhir",
            "Jumada al-ula":"Jumadil Awal","Jumada al-akhirah":"Jumadil Akhir",
            "Rajab":"Rajab","Sha'ban":"Sya'ban","Ramadan":"Ramadhan",
            "Shawwal":"Syawal","Dhu al-Qi'dah":"Dzulqadah","Dhu al-qi'dah":"Dzulqadah",
            "Dhu al-Hijjah":"Dzulhijjah","Dhu al-hijjah":"Dzulhijjah"
        };
        const clean = monthEn.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return map[monthEn] || map[clean] || clean;
    }

    // Update UI kartu Hijriah — selalu tampil instan, API hanya mempresisikan tanggal Hijriah
    function updateHijriDateUI(hijri) {
        const masehiEl = document.getElementById("hijriMasehiText");
        const islamEl  = document.getElementById("hijriIslamText");

        // Masehi: selalu dari kalkulasi lokal
        if (masehiEl) masehiEl.textContent = getIndonesianGregorianDate();

        if (islamEl) {
            if (hijri && hijri.month && hijri.month.en) {
                // Data akurat dari API
                const mn = getCleanHijriMonth(hijri.month.en);
                islamEl.textContent = `${parseInt(hijri.day)} ${mn} ${hijri.year} H`;
            } else {
                // Kalkulasi lokal sebagai fallback instan
                const h = getLocalHijriDate();
                islamEl.textContent = `${h.day} ${h.monthName} ${h.year} H`;
            }
        }
    }

    // Tampilkan tanggal SEKARANG juga — tidak tunggu API
    updateHijriDateUI(null);

    // Fungsi fetch jadwal sholat dari API dengan Caching
    async function initJadwalSholat() {
        const cachedDate = localStorage.getItem("jadwal_shalat_date");
        const cachedData = localStorage.getItem("jadwal_shalat_cache");

        // Jika ada cache untuk hari ini, gunakan langsung
        if (cachedDate === todayStr && cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Deteksi cache lama (format datar, tidak memiliki .timings) dan hapus
                if (!parsed.timings) {
                    console.warn("Cache jadwal format lama terdeteksi, menghapus dan fetch ulang...");
                    localStorage.removeItem("jadwal_shalat_cache");
                    localStorage.removeItem("jadwal_shalat_date");
                    // Lanjut ke fetch baru di bawah
                } else {
                    const timings = parsed.timings;
                    const hijri = parsed.hijri || null;

                    updateJadwalSholatArray(timings);
                    updateScheduleTableUI(timings);
                    updateHijriDateUI(hijri);
                    updateCountdown();
                    console.log("Memuat Jadwal Sholat & Tanggal Hijriah dari Cache Lokal (Hari Ini)");
                    return;
                }
            } catch (e) {
                console.error("Gagal parse cache jadwal sholat, mencoba fetch ulang...", e);
                localStorage.removeItem("jadwal_shalat_cache");
                localStorage.removeItem("jadwal_shalat_date");
            }
        }

        // Jika tidak ada cache / ganti hari, fetch dari API Aladhan (Metode 11 Kemenag)
        try {
            console.log("Melakukan Fetch Jadwal Sholat Baru dari Aladhan API...");
            const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Sukoharjo&country=Indonesia&method=11`);
            if (!response.ok) throw new Error("Respon API bermasalah");

            const result = await response.json();
            const timings = result.data.timings;
            const hijri = result.data.date.hijri;

            if (timings) {
                // Simpan ke cache beserta tanggal Hijriah
                const cacheObj = { timings, hijri };
                localStorage.setItem("jadwal_shalat_cache", JSON.stringify(cacheObj));
                localStorage.setItem("jadwal_shalat_date", todayStr);

                // Update UI dan Array
                updateJadwalSholatArray(timings);
                updateScheduleTableUI(timings);
                updateHijriDateUI(hijri);
                updateCountdown();
                console.log("Jadwal Sholat & Tanggal Hijriah berhasil di-fetch dan disimpan di cache!");
            }
        } catch (err) {
            console.warn("Koneksi gagal atau offline. Menggunakan Jadwal Sholat Statis Bawaan (Fallback):", err);
            // Gunakan data bawaan statis
            updateCountdown();
            updateHijriDateUI(null);
        }
    }

    function getTimeInMinutes(timeStr) {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    }

    function pad(n) {
        return n.toString().padStart(2, "0");
    }

    function updateCountdown() {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const nowSeconds = now.getSeconds();

        // Cari waktu sholat berikutnya
        let nextSholat = null;
        for (let i = 0; i < jadwalSholat.length; i++) {
            const waktu = getTimeInMinutes(jadwalSholat[i].jam);
            if (waktu > nowMinutes) {
                nextSholat = jadwalSholat[i];
                break;
            }
        }

        // Jika sudah lewat semua, ambil Subuh besok
        if (!nextSholat) {
            nextSholat = jadwalSholat[0];
        }

        // Update judul countdown
        sholatTitleEl.textContent = "Adzan " + nextSholat.nama;

        // Hitung total detik
        const nextTime = getTimeInMinutes(nextSholat.jam);
        let diffMinutes = nextTime - nowMinutes;
        if (diffMinutes < 0) {
            diffMinutes = (24 * 60) - nowMinutes + nextTime;
        }

        let totalSeconds = diffMinutes * 60 - nowSeconds;
        if (totalSeconds < 0) totalSeconds = 0;

        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        jamEl[0].textContent = pad(hours);
        jamEl[1].textContent = pad(mins);
        jamEl[2].textContent = pad(secs);

        labelEl[0].textContent = hours === 1 ? "Jam" : "Jam";
        labelEl[1].textContent = mins === 1 ? "Menit" : "Menit";
        labelEl[2].textContent = secs === 1 ? "Detik" : "Detik";

        // Update active class di jadwal grid secara aman berbasis data-sholat (Memperbaiki bug Terbit)
        const activeSholatKey = nextSholat.nama.toLowerCase();
        const allJadwalItems = document.querySelectorAll(".jadwal-item");
        
        allJadwalItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("data-sholat") === activeSholatKey) {
                item.classList.add("active");
            }
        });
    }

    // Inisialisasi awal jadwal & jalankan countdown interval
    initJadwalSholat();
    setInterval(updateCountdown, 1000);


    // ===== HIKMAH HARI INI (Rotasi Harian) =====
    const hikmahList = [
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang berjalan menuju masjid, maka Allah akan menyediakan baginya tempat di surga setiap kali ia pergi dan pulang."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia."', sumber: "HR. Ahmad" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga."', sumber: "HR. Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Janganlah kamu marah, maka bagimu surga."', sumber: "HR. Thabrani" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sesungguhnya bersama kesulitan ada kemudahan."', sumber: "QS. Al-Insyirah: 6" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang bersyukur, maka sesungguhnya ia bersyukur untuk dirinya sendiri."', sumber: "QS. Luqman: 12" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Senyummu di hadapan saudaramu adalah sedekah."', sumber: "HR. Tirmidzi" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Janganlah kalian saling membenci, saling dengki, dan saling membelakangi. Jadilah hamba Allah yang bersaudara."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya."', sumber: "QS. Al-Baqarah: 286" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Maka nikmat Tuhanmu yang manakah yang kamu dustakan?"', sumber: "QS. Ar-Rahman: 13" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan barang siapa yang bertakwa kepada Allah, niscaya Dia akan memberikan jalan keluar dan memberinya rezeki dari arah yang tidak disangka-sangka."', sumber: "QS. Ath-Thalaq: 2-3" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sebaik-baik kalian adalah yang belajar Al-Qur\'an dan mengajarkannya."', sumber: "HR. Bukhari" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Janganlah kalian meremehkan kebaikan sekecil apa pun, meskipun hanya bertemu dengan saudaramu dengan wajah yang berseri."', sumber: "HR. Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Perumpamaan orang yang berdzikir kepada Tuhannya dan yang tidak, seperti orang hidup dan orang mati."', sumber: "HR. Bukhari" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan mohonlah ampun kepada Tuhanmu, kemudian bertobatlah kepada-Nya. Sesungguhnya Tuhanku Maha Penyayang lagi Maha Pengasih."', sumber: "QS. Hud: 90" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang menutupi aib seorang muslim, maka Allah akan menutupi aibnya di dunia dan akhirat."', sumber: "HR. Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar."', sumber: "QS. Al-Ankabut: 45" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Tidaklah suatu kaum berkumpul di salah satu rumah Allah (masjid) untuk membaca Kitabullah dan mempelajarinya, melainkan ketenteraman akan turun kepada mereka."', sumber: "HR. Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan janganlah kamu berputus asa dari rahmat Allah. Sesungguhnya tiada yang berputus asa dari rahmat Allah melainkan orang-orang yang kafir."', sumber: "QS. Yusuf: 87" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Raihlah lima perkara sebelum lima perkara: mudamu sebelum tuamu, sehatmu sebelum sakitmu, kayamu sebelum miskinmu, waktu luangmu sebelum sibukmu, dan hidupmu sebelum matimu."', sumber: "HR. Hakim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sesungguhnya Allah tidak akan mengubah keadaan suatu kaum sebelum mereka mengubah keadaan diri mereka sendiri."', sumber: "QS. Ar-Ra\'d: 11" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang beriman kepada Allah dan hari akhir, maka muliakanlah tetangganya."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan bersabarlah. Sesungguhnya Allah beserta orang-orang yang sabar."', sumber: "QS. Al-Anfal: 46" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Tidak akan beriman salah seorang di antara kalian hingga ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Wahai orang-orang yang beriman, berdzikirlah kepada Allah dengan dzikir sebanyak-banyaknya."', sumber: "QS. Al-Ahzab: 41" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Sesungguhnya amal yang paling dicintai Allah adalah yang paling kontinu (terus-menerus) walaupun sedikit."', sumber: "HR. Bukhari & Muslim" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan Tuhanmu berfirman: Berdoalah kepada-Ku, niscaya akan Aku perkenankan bagimu."', sumber: "QS. Ghafir: 60" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Barang siapa yang memberi makan orang yang berpuasa, maka baginya pahala seperti orang yang berpuasa tanpa mengurangi pahala orang tersebut sedikit pun."', sumber: "HR. Tirmidzi" },
        { judul: "🌟 Mutiara Hikmah", teks: '"Dan carilah pada apa yang telah dianugerahkan Allah kepadamu (kebahagiaan) negeri akhirat, dan janganlah kamu melupakan bagianmu dari (kenikmatan) dunia."', sumber: "QS. Al-Qashash: 77" }
    ];

    function updateHikmah() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % hikmahList.length;

        const judulEl = document.getElementById("hikmahJudul");
        const teksEl = document.getElementById("hikmahTeks");
        const sumberEl = document.getElementById("hikmahSumber");

        if (judulEl && teksEl && sumberEl) {
            judulEl.textContent = hikmahList[index].judul;
            teksEl.textContent = hikmahList[index].teks;
            sumberEl.textContent = "— " + hikmahList[index].sumber;
        }
    }

    // ===== FLOATING SCROLL DOTS & SMART AUTO-HIDE NAVBAR LOGIC =====
    const appContainer = document.querySelector(".app-container");
    const scrollDots = document.querySelectorAll(".scroll-dot");
    const bottomNav = document.querySelector(".bottom-nav");
    let lastScrollTop = 0;
    let scrollStopTimer;

    const navBeranda = document.getElementById("nav-beranda");
    const navSholat = document.getElementById("nav-sholat");
    const navLainnya = document.getElementById("nav-lainnya");

    if (appContainer) {
        const sections = [
            document.getElementById("sec-beranda"),
            document.getElementById("sec-fitur"),
            document.getElementById("sec-amal")
        ];

        if (scrollDots.length > 0) {
            appContainer.addEventListener("scroll", function () {
                const screenHeight = appContainer.clientHeight;
                const scrollTop = appContainer.scrollTop;
                
                // Deteksi activeIndex secara dinamis berdasarkan posisi scroll
                let activeIndex = 0;
                sections.forEach((sec, idx) => {
                    if (sec) {
                        // Jika posisi scroll sudah melewati batas atas section dikurangi sepertiga layar
                        if (scrollTop >= sec.offsetTop - screenHeight / 3) {
                            activeIndex = idx;
                        }
                    }
                });

                scrollDots.forEach((dot, idx) => {
                    if (idx === activeIndex) {
                        dot.classList.add("active");
                    } else {
                        dot.classList.remove("active");
                    }
                });

                // Update Active State di Bottom Nav
                const navItems = document.querySelectorAll(".nav-bottom-item");
                navItems.forEach(item => {
                    if (item.id === "nav-beranda" || item.id === "nav-sholat" || item.id === "nav-lainnya") {
                        item.classList.remove("active");
                    }
                });
                
                if (activeIndex === 0) {
                    if (navBeranda) navBeranda.classList.add("active");
                } else if (activeIndex >= 1) {
                    if (navLainnya) navLainnya.classList.add("active");
                }

                // ===== SMART AUTO-HIDE NAVBAR =====
                if (bottomNav) {
                    // Cek apakah scroll telah mencapai bagian paling bawah dari kontainer
                    const isAtBottom = (scrollTop + screenHeight >= appContainer.scrollHeight - 10);

                    if (scrollTop < 50 || isAtBottom) {
                        // Selalu tampilkan di paling atas atau paling bawah
                        bottomNav.classList.remove("nav-hidden");
                    } else if (scrollTop > lastScrollTop) {
                        // Gulir ke bawah -> Sembunyikan navbar
                        bottomNav.classList.add("nav-hidden");
                    } else {
                        // Gulir ke atas -> Tampilkan navbar kembali
                        bottomNav.classList.remove("nav-hidden");
                    }

                    // Tampilkan kembali secara otomatis setelah 250ms berhenti melakukan scroll (Debounce)
                    clearTimeout(scrollStopTimer);
                    scrollStopTimer = setTimeout(function() {
                        bottomNav.classList.remove("nav-hidden");
                    }, 250);
                }

                lastScrollTop = scrollTop;
            });

            // Click to scroll to screen (Dots)
            scrollDots.forEach((dot, idx) => {
                dot.addEventListener("click", function () {
                    const targetSec = sections[idx];
                    if (targetSec) {
                        appContainer.scrollTo({
                            top: targetSec.offsetTop,
                            behavior: "smooth"
                        });
                    }
                });
            });

            // Click handlers untuk Navbar Items (Internal Scrolling)
            if (navBeranda) {
                navBeranda.addEventListener("click", function (e) {
                    e.preventDefault();
                    appContainer.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                });
            }

            if (navLainnya) {
                navLainnya.addEventListener("click", function (e) {
                    e.preventDefault();
                    const targetSec = document.getElementById("sec-fitur");
                    if (targetSec) {
                        appContainer.scrollTo({
                            top: targetSec.offsetTop,
                            behavior: "smooth"
                        });
                    }
                });
            }
        }
    }

    // ===== FETCH DATA DONASI DARI GOOGLE SHEETS =====
    async function fetchDonasiData() {
        const url = "https://script.google.com/macros/s/AKfycbzDxO8T_KJq06d5iXzu6cIVq7_LoVLOkie-P8gTAeKms5yJYkV-ppvkFy-W2k4B4Ju5Ag/exec";
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            let totalJumat = 0;
            let totalSosial = 0;
            let totalBarakah = 0;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const rows = data.value;
            // Loop through data (skip header at index 0)
            if (rows && rows.length > 1) {
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row[2] === "Laporan Keuangan" && (row[7] || "").toUpperCase() === "PEMASUKAN") {
                        let d;
                        try {
                            d = new Date(row[10] || row[0]);
                        } catch(e) { continue; }
                        
                        // FILTER BY CURRENT MONTH
                        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                            const nominal = parseFloat(row[8]) || 0;
                            const ket = (row[9] || "").toLowerCase();

                            if (ket.includes("jum'at") || ket.includes("jumat")) {
                                totalJumat += nominal;
                            } else if (ket.includes("sosial")) {
                                totalSosial += nominal;
                            } else if (ket.includes("barokah") || ket.includes("barakah")) {
                                totalBarakah += nominal;
                            }
                        }
                    }
                }
            }

            // Target Operasional Masjid (Kotak Jumat)
            const targetJumat = 10000000;
            const persenJumat = Math.min(Math.round((totalJumat / targetJumat) * 100), 100);

            // Update DOM Kotak Jumat
            const persenJumatEl = document.getElementById("persen-jumat");
            const barJumatEl = document.getElementById("bar-jumat");
            const nominalJumatEl = document.getElementById("nominal-jumat");

            if (persenJumatEl) persenJumatEl.textContent = `${persenJumat}% Terkumpul`;
            if (barJumatEl) barJumatEl.style.width = `${persenJumat}%`;
            if (nominalJumatEl) nominalJumatEl.textContent = `Rp ${totalJumat.toLocaleString("id-ID")} dari Rp ${targetJumat.toLocaleString("id-ID")}`;

            // Update DOM Kotak Sosial
            const nominalSosialEl = document.getElementById("nominal-sosial");
            if (nominalSosialEl) nominalSosialEl.textContent = `Rp ${totalSosial.toLocaleString("id-ID")}`;

            // Update DOM Kotak Barakah
            const nominalBarakahEl = document.getElementById("nominal-barakah");
            if (nominalBarakahEl) nominalBarakahEl.textContent = `Rp ${totalBarakah.toLocaleString("id-ID")}`;

        } catch (error) {
            console.error("Gagal mengambil data donasi:", error);
            const nomJumat = document.getElementById("nominal-jumat");
            const nomSosial = document.getElementById("nominal-sosial");
            const nomBarakah = document.getElementById("nominal-barakah");
            
            if (nomJumat) nomJumat.textContent = "Gagal memuat data";
            if (nomSosial) nomSosial.textContent = "Gagal memuat data";
            if (nomBarakah) nomBarakah.textContent = "Gagal memuat data";
        }
    }

    // ===== MODAL KALENDER HIJRIAH =====
    const hijriCard = document.querySelector('.hijri-calendar-card');
    const hijriModal = document.getElementById('hijriCalendarModal');
    const closeHijriModalBtn = document.getElementById('closeHijriModal');
    const hijriCalendarDays = document.getElementById('hijriCalendarDays');
    const hijriModalTitle = document.getElementById('hijriModalTitle');
    const prevHijriMonthBtn = document.getElementById('prevHijriMonth');
    const nextHijriMonthBtn = document.getElementById('nextHijriMonth');

    let currentHijriMonthOffset = 0;

    function generateHijriCalendar(offset = 0) {
        const grid = document.getElementById('hijriCalendarGrid');
        if (!grid) return;
        grid.innerHTML = ''; // Clear previous

        // Recreate Header Hari
        const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        days.forEach(d => {
            const el = document.createElement('div');
            el.className = 'hijri-day-header';
            el.textContent = d;
            grid.appendChild(el);
        });

        const today = new Date();
        let hDate = getLocalHijriDate(today);

        // Find the 1st day of current Hijri month (Gregorian date)
        const firstDayGregorian = new Date(today);
        firstDayGregorian.setDate(today.getDate() - (hDate.day - 1));

        // Shift by offset
        if (offset > 0) {
            for (let i = 0; i < offset; i++) {
                firstDayGregorian.setDate(firstDayGregorian.getDate() + 30);
                hDate = getLocalHijriDate(firstDayGregorian);
                firstDayGregorian.setDate(firstDayGregorian.getDate() - (hDate.day - 1));
            }
        } else if (offset < 0) {
            for (let i = 0; i < Math.abs(offset); i++) {
                firstDayGregorian.setDate(firstDayGregorian.getDate() - 20);
                hDate = getLocalHijriDate(firstDayGregorian);
                firstDayGregorian.setDate(firstDayGregorian.getDate() - (hDate.day - 1));
            }
        }

        const targetMonthHijri = getLocalHijriDate(firstDayGregorian);
        const startDayOfWeek = firstDayGregorian.getDay(); // 0 (Ahad) to 6 (Sabtu)
        
        if (hijriModalTitle) {
            hijriModalTitle.textContent = `${targetMonthHijri.monthName} ${targetMonthHijri.year} H`;
        }

        // Empty cells for the first row to align day of week
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'hijri-date-cell empty';
            grid.appendChild(emptyCell);
        }

        let currentGregorian = new Date(firstDayGregorian);
        let daysGenerated = 0;

        // Loop up to 30 days
        while (daysGenerated < 30) {
            const tempHDate = getLocalHijriDate(currentGregorian);
            
            // Stop if we hit the next Hijri month (day 1 again)
            if (tempHDate.day === 1 && daysGenerated > 25) break;

            const dayOfWeek = currentGregorian.getDay();
            const gDateNum = currentGregorian.getDate();
            const hDateNum = tempHDate.day;

            const cell = document.createElement('div');
            cell.className = 'hijri-date-cell';

            if (dayOfWeek === 5) cell.classList.add('jumat');
            if (hDateNum >= 13 && hDateNum <= 15) cell.classList.add('ayyamul-bidh');

            // Is today?
            if (currentGregorian.toDateString() === today.toDateString()) {
                cell.classList.add('today');
                // Remove others to prioritize today's color
                cell.classList.remove('jumat');
                cell.classList.remove('ayyamul-bidh');
            }

            cell.innerHTML = `
                <span class="masehi-num">${gDateNum}</span>
                <span class="hijri-num">${hDateNum}</span>
            `;

            grid.appendChild(cell);

            // Move to next day
            currentGregorian.setDate(currentGregorian.getDate() + 1);
            daysGenerated++;
        }
    }

    if (hijriCard && hijriModal) {
        hijriCard.style.cursor = 'pointer';
        hijriCard.addEventListener('click', () => {
            currentHijriMonthOffset = 0;
            generateHijriCalendar(currentHijriMonthOffset);
            hijriModal.classList.add('show');
        });

        if (prevHijriMonthBtn) {
            prevHijriMonthBtn.addEventListener('click', () => {
                currentHijriMonthOffset--;
                generateHijriCalendar(currentHijriMonthOffset);
            });
        }

        if (nextHijriMonthBtn) {
            nextHijriMonthBtn.addEventListener('click', () => {
                currentHijriMonthOffset++;
                generateHijriCalendar(currentHijriMonthOffset);
            });
        }

        if (closeHijriModalBtn) {
            closeHijriModalBtn.addEventListener('click', () => {
                hijriModal.classList.remove('show');
            });
        }

        // Click outside to close
        hijriModal.addEventListener('click', (e) => {
            if (e.target === hijriModal) {
                hijriModal.classList.remove('show');
            }
        });
    }

    // ===== STATISTIK PENGUNJUNG (REAL-TIME API) =====
    async function updateVisitorStats() {
        const totalVisitsEl = document.getElementById("visit-total");
        const todayVisitsEl = document.getElementById("visit-today");

        if (!totalVisitsEl || !todayVisitsEl) return;

        // Dapatkan tanggal hari ini (format: YYYY-MM-DD)
        const getTodayDateString = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const dateStr = getTodayDateString();
        
        // Kunci unik untuk counter di counterapi.dev
        const namespace = "masjid_almuhtadin";
        const totalKey = "total_visits";
        const todayKey = `visits_${dateStr}`;

        // Cek localStorage agar tidak melakukan increment berulang kali dalam 1 jam
        const hasVisitedThisHour = localStorage.getItem("visited_this_hour");
        const now = Date.now();

        let shouldIncrement = true;
        if (hasVisitedThisHour && now - parseInt(hasVisitedThisHour) < 3600000) {
            shouldIncrement = false;
        }

        const action = shouldIncrement ? "increment" : "get";

        try {
            // Fetch Total Visits
            const totalRes = await fetch(`https://api.counterapi.dev/v1/${namespace}/${totalKey}/${action}`);
            const totalData = await totalRes.json();
            
            // Fetch Today's Visits
            const todayRes = await fetch(`https://api.counterapi.dev/v1/${namespace}/${todayKey}/${action}`);
            const todayData = await todayRes.json();

            if (totalData && totalData.value !== undefined) {
                totalVisitsEl.textContent = totalData.value.toLocaleString("id-ID");
            }
            
            if (todayData && todayData.value !== undefined) {
                todayVisitsEl.textContent = todayData.value.toLocaleString("id-ID");
            }

            if (shouldIncrement) {
                localStorage.setItem("visited_this_hour", now.toString());
            }
        } catch (error) {
            console.warn("Gagal terhubung ke API Counter. Menggunakan fallback lokal:", error);
            // Fallback: Simulasi angka kunjungan yang realistis
            totalVisitsEl.textContent = "3.248";
            todayVisitsEl.textContent = "84";
        }
    }

    updateHikmah();
    fetchDonasiData();
    updateVisitorStats();
});
