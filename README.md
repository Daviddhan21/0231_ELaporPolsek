# E-Lapor Polsek Prambanan (`0231_ELaporPolsek`)

Aplikasi mobile berbasis Android untuk layanan pelaporan kejadian darurat dan pengaduan masyarakat di wilayah hukum **Kepolisian Sektor (Polsek) Prambanan, Resor Klaten, Jawa Tengah**. Dikembangkan sebagai Project Akhir Mata Kuliah **Pengembangan Aplikasi Mobile (PAM) 2026** di bawah tema **Lingkungan & Sosial**.

---

## Informasi Pengembang
* **Nama:** Rayvanza Davida Ramadhan
* **NIM:** 20240140231
* **Kelas:** E
* **Program Studi:** Teknologi Informasi — Universitas Muhammadiyah Yogyakarta (UMY)
* **Dokumen Spesifikasi:** `SRS_0231_ELaporPolsekPrambanan_v1.2.docx`

---

## Fitur Utama Sistem (Sesuai SRS v1.2)
1. **Autentikasi Multirole & Demo Switcher (`REQ-AUTH`):**
   * Registrasi & login warga tervalidasi NIK 16 digit menggunakan **JWT (Access Token & Refresh Token)** yang disimpan aman pada **Jetpack DataStore**.
   * Tombol akses khusus Petugas (*Officer Shield Icon*) di pojok kanan atas layar login menggunakan **NRP 8 digit** hasil *database seeding*.
   * Tombol **Quick Fill Demo** untuk pengujian cepat akun Warga maupun Petugas.
2. **Pembuatan Laporan, Validasi Yurisdiksi & Offline Draft (`REQ-REP`):**
   * Input kategori aduan (*Kriminalitas/Begal, Laka Lantas Solo–Yogya, Gangguan Kamtibmas, Bencana/Fasilitas Publik*), tingkat urgensi (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), titik koordinat GPS, serta lampiran foto bukti.
   * **Privacy Toggle:** Menyamarkan identitas pelapor di tampilan publik (misal: `Pelapor #0231`) dengan tetap mengunci identitas asli NIK di database untuk keperluan verifikasi kepolisian.
   * **Validasi Batas Yurisdiksi:** Peringatan dini dan penandaan otomatis (`out_of_jurisdiction`) jika koordinat kejadian berada di luar wilayah hukum Polsek Prambanan (radius > 7 km atau lintas batas DIY).
   * **Anti-Spam & Disclaimer Hukum:** Pembatasan maksimal 3 laporan berstatus `PENDING` secara bersamaan per akun warga serta *disclaimer* pertanggungjawaban hukum berdasarkan **Pasal 220 KUHP, Pasal 317 KUHP, dan UU ITE**.
   * **Offline Draft:** Penyimpanan draf dan foto otomatis ke *File Storage* lokal saat perangkat kehilangan koneksi internet.
3. **Peta Insiden Aktif, Geofencing Alert & Auto-Filter Kasus Selesai (`REQ-MAP`):**
   * Peta interaktif berpusat di **Polsek Prambanan (`-7.7547, 110.4912`)** dengan warna pin sesuai tingkat urgensi dan penanda area rawan (*Geofencing Alert*).
   * Penyembunyian otomatis marker kasus berstatus `SOLVED`, `TRANSFERRED`, atau `REJECTED` dari peta utama sementara seluruh riwayat tetap tersimpan permanen.
4. **Pengelolaan Laporan Warga (`REQ-MOD`):**
   * Warga dapat mengedit (`PUT`) atau menghapus permanen (`DELETE`) laporan miliknya selama status masih `PENDING`.
5. **Verifikasi, Penanganan Kasus & Upload Foto TKP Petugas (`REQ-OFF`):**
   * Antrean laporan prioritas tertinggi (`CRITICAL` ke `LOW`), pembaruan status (`IN_PROGRESS`, `SOLVED`, `TRANSFERRED`, `REJECTED`), pelimpahan kasus lintas yurisdiksi, unggah foto bukti penyelesaian di TKP, serta **Timeline Audit Trail**.
6. **Emergency SOS Quick-Dial (`REQ-SOS`):**
   * Panggilan darurat cepat (`ACTION_DIAL`) menuju **SPKT Polsek Prambanan** atau **Call Center Kepolisian 110**.

---

## Arsitektur & Teknologi
* **Mobile Client:** Kotlin, **Jetpack Compose** (Material Design 3), **Jetpack Navigation Compose**, Arsitektur **MVVM** (`StateFlow`), Retrofit 2 + OkHttp, Jetpack DataStore.
* **Backend REST API:** Node.js v20+ & Express.js (JSON & `multipart/form-data`).
* **Database:** Cloud Relational Database (MySQL / PostgreSQL) dengan 4 entitas utama: `users`, `categories`, `reports`, dan `report_responses`.

---

## Akun Demo Preset (Database Seeding)
| Role | Kredensial Login | Password | Keterangan Unit |
| :--- | :--- | :--- | :--- |
| **Pelapor (Warga)** | `warga.prambanan@demo.id` | `warga123` | Warga Kecamatan Prambanan, Klaten |
| **Officer (SPKT)** | NRP: `98040231` | `polsek123` | SPKT Polsek Prambanan |
| **Officer (Lantas)** | NRP: `96110512` | `polsek123` | Unit Lantas Polsek Prambanan |
| **Officer (Reskrim)** | NRP: `95080844` | `polsek123` | Unit Reskrim Polsek Prambanan |

---

## Weekly Progress Log
* **Minggu 1 (18 – 21 November 2026):**
  * Penetapan tema proyek **Lingkungan & Sosial** dengan studi kasus **E-Lapor Polsek Prambanan** (`0231_ELaporPolsek`).
  * Penyusunan dokumen spesifikasi kebutuhan perangkat lunak lengkap (**SRS v1.2**) beserta 5 diagram analisis (ERD, RAT, Use Case Diagram, Flow Diagram 6 Fitur, dan Activity Diagram Swimlane).
  * Perancangan skema 4 tabel basis data relasional, aturan validasi batas yurisdiksi (`TRANSFERRED`), serta mekanisme *anti-spam rate limiting* & *closed-provisioning* akun petugas.
  * Inisialisasi repositori GitHub dan dokumentasi awal `README.md`.
