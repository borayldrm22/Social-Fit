// Backend adresi.
// USE_LOCAL_BACKEND:
//   false → her zaman Render'daki canlı backend (local backend gerekmez, telefonda direkt çalışır) [ÖNERİLEN]
//   true  → geliştirmede kendi bilgisayarındaki backend (önce `cd backend && npm run dev` çalıştır)
const USE_LOCAL_BACKEND = false;

// Fiziksel telefonda local backend kullanacaksan 127.0.0.1 yerine bilgisayarının LAN IP'sini yaz (ör. http://192.168.1.20:4000)
const LOCAL_API = 'http://127.0.0.1:4000';
const REMOTE_API = 'https://social-fit-api-m92f.onrender.com';

export const API_BASE = __DEV__ && USE_LOCAL_BACKEND ? LOCAL_API : REMOTE_API;
