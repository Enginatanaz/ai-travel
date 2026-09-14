# AI Seyahat Planlama

AI destekli seyahat planlama uygulaması. Frontend React/Vite, backend Node.js/Express ve AI katmanı Gemini API kullanır.

## Gereksinimler
- Node.js 20+
- pnpm 10+
- Gemini API anahtarı

## Kurulum
```bash
pnpm install
cp .env.example .env
```
`.env` içine `GEMINI_API_KEY` ekleyin.

## Geliştirme
```bash
pnpm dev
```
- Frontend: http://localhost:5173
- API: http://localhost:3001

Frontend `/api` isteklerini otomatik olarak backend'e yönlendirir.

## Güvenlik
API anahtarlarını frontend'e koymayın ve Git'e commit etmeyin.
