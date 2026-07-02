import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  id: {
    translation: {
      "app_name": "ModKita",
      "nav_home": "Beranda",
      "nav_uptime": "Status Sistem",
      "nav_dashboard": "Dasbor Admin",
      "nav_login": "Masuk",
      "nav_register": "Daftar",
      "nav_logout": "Keluar",
      "hero_title": "Tingkatkan Pengalamanmu dengan",
      "hero_title_highlight": "Mod Premium",
      "hero_desc": "Pusat eksklusif untuk modifikasi game berkualitas. Temukan, unduh, dan tingkatkan gameplay kamu dengan koleksi mod terverifikasi kami.",
      "btn_req_mod": "Request Mod",
      "mods_available": "Mod Tersedia",
      "mods_found": "Mod Ditemukan",
      "no_mods": "Belum ada mod yang tersedia.",
      "card_free": "Gratis",
      "card_restricted": "Akses Khusus",
      "btn_login_view": "Masuk untuk Melihat",
      "btn_awaiting": "Menunggu Persetujuan",
      "btn_view_dl": "Lihat & Unduh",
      "modal_desc": "Deskripsi",
      "modal_changelog": "Riwayat Pembaruan",
      "modal_details": "Detail Mod",
      "modal_uploaded": "Diunggah",
      "modal_size": "Ukuran File",
      "modal_dl_count": "Total Unduhan",
      "modal_btn_dl": "Unduh Mod",
      "login_title": "Selamat Datang Kembali",
      "login_desc": "Masuk untuk mengakses mod eksklusif",
      "login_email_ph": "Alamat Email (harus berakhiran .mod)",
      "login_pass_ph": "Kata Sandi",
      "btn_signin_member": "Masuk sebagai Member",
      "btn_signin_github": "Masuk dengan GitHub",
      "btn_signin_admin": "Masuk sebagai Admin",
      "no_account": "Belum punya akun member?",
      "req_mod_title": "Request Mod Baru",
      "req_mod_desc": "Kirim permintaan modifikasi yang kamu inginkan ke Admin.",
      "req_mod_name": "Nama Mod / Game",
      "req_mod_detail": "Detail Permintaan",
      "btn_send_req": "Kirim Request",
      "status_pending": "Menunggu",
      "status_approved": "Disetujui",
      "status_dev": "Developer",
      "status_admin": "Admin"
    }
  },
  en: {
    translation: {
      "app_name": "ModKita",
      "nav_home": "Home",
      "nav_uptime": "System Status",
      "nav_dashboard": "Admin Dashboard",
      "nav_login": "Login",
      "nav_register": "Register",
      "nav_logout": "Logout",
      "hero_title": "Elevate Your Experience with",
      "hero_title_highlight": "Premium Mods",
      "hero_desc": "The exclusive hub for high-quality game modifications. Discover, download, and enhance your gameplay with our curated selection.",
      "btn_req_mod": "Request Mod",
      "mods_available": "Available Mods",
      "mods_found": "Mods Found",
      "no_mods": "No mods available yet.",
      "card_free": "Free",
      "card_restricted": "Restricted",
      "btn_login_view": "Login to View",
      "btn_awaiting": "Awaiting Approval",
      "btn_view_dl": "View & Download",
      "modal_desc": "Description",
      "modal_changelog": "Changelog",
      "modal_details": "Mod Details",
      "modal_uploaded": "Uploaded",
      "modal_size": "File Size",
      "modal_dl_count": "Total Downloads",
      "modal_btn_dl": "Download Mod",
      "login_title": "Welcome Back",
      "login_desc": "Sign in to access exclusive mods",
      "login_email_ph": "Email Address (must end in .mod)",
      "login_pass_ph": "Password",
      "btn_signin_member": "Sign In as Member",
      "btn_signin_github": "Sign In with GitHub",
      "btn_signin_admin": "Sign In as Admin",
      "no_account": "Don't have a member account?",
      "req_mod_title": "Request a New Mod",
      "req_mod_desc": "Send a modification request to the Admins.",
      "req_mod_name": "Mod / Game Name",
      "req_mod_detail": "Request Details",
      "btn_send_req": "Send Request",
      "status_pending": "Pending",
      "status_approved": "Approved",
      "status_dev": "Developer",
      "status_admin": "Admin"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "id", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
