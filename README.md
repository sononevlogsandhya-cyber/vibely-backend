# Vibely Backend — Instagram-jaisa Social App Backend

Node.js + Express + MongoDB + Socket.io. KSConnect jaise hi pattern pe bana hai.

## Features
- Auth (Register/Login with JWT)
- Posts (Upload photo/video, Feed, Explore grid, Delete)
- Reels (Upload video reel, Feed, Like, View count, Comments with edit/delete)
- Like / Unlike (with notification)
- Comments (Add/Edit/Delete, with notification, bad-words + spam filter)
- Follow / Unfollow (with notification)
- Stories (24hr auto-expire via MongoDB TTL index)
- Direct Chat (Real-time via Socket.io)
- Notifications (like, comment, follow, message) — real-time push via socket

## Setup

```bash
npm install
cp .env.example .env
```

`.env` file mein ye fill karo:
- `MONGO_URI` → MongoDB Atlas se connection string (same organization jisme ksconnect-cluster hai, naya database `vibely` use karo)
- `JWT_SECRET` → koi bhi random strong string
- `CLOUDINARY_*` → cloudinary.com pe free account banao, dashboard se cloud_name/api_key/api_secret milega (photo/video upload ke liye zaroori hai)

Local run:
```bash
npm run dev
```

## Deploy on Render.com (jaisa KSConnect deployed hai)
1. Is folder ko naye GitHub repo `vibely-backend` mein push karo
2. Render Dashboard → New → Web Service → apna GitHub repo connect karo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment tab mein `.env` ke saare variables add karo
6. Deploy — URL milega jaisa `vibely-backend.onrender.com`

## API Endpoints (Vibely Android app inhi ko expect karta hai)

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Signup |
| POST | /api/auth/login | Login |
| GET | /api/users/me | Apna profile |
| PUT | /api/users/me | Profile update (bio, pic) |
| GET | /api/users/search?q= | User search |
| GET | /api/users/:id | Kisi ka profile |
| POST | /api/users/:id/follow | Follow/Unfollow toggle |
| GET | /api/users/:id/followers | Followers list |
| GET | /api/users/:id/following | Following list |
| POST | /api/posts | Naya post (multipart: `image`, `caption`) |
| GET | /api/posts/feed | Home feed |
| GET | /api/posts/explore | Explore grid |
| GET | /api/posts/user/:userId | Kisi user ke sare posts |
| GET | /api/posts/:id | Single post |
| DELETE | /api/posts/:id | Post delete |
| POST | /api/posts/:id/like | Like/Unlike toggle |
| GET | /api/posts/:id/likes | Kisne like kiya list |
| POST | /api/posts/:id/comments | Comment add (bad-words/spam filter lagta hai) |
| GET | /api/posts/:id/comments | Comments list |
| PUT | /api/comments/:id | Comment edit (khud ka hi) |
| DELETE | /api/comments/:id | Comment delete |
| POST | /api/reels | Naya reel (multipart: `video`, `caption`) |
| GET | /api/reels/feed | Reels feed |
| GET | /api/reels/user/:userId | Kisi user ke sare reels |
| GET | /api/reels/:id | Single reel |
| DELETE | /api/reels/:id | Reel delete |
| POST | /api/reels/:id/view | View count badhao |
| POST | /api/reels/:id/like | Like/Unlike toggle |
| POST | /api/reels/:id/comments | Reel comment add |
| GET | /api/reels/:id/comments | Reel comments list |
| PUT | /api/reels/comments/:id | Reel comment edit |
| DELETE | /api/reels/comments/:id | Reel comment delete |
| POST | /api/stories | Naya story (multipart: `media`) |
| GET | /api/stories/feed | Stories feed (grouped by user) |
| POST | /api/stories/:id/view | Story viewed mark |
| DELETE | /api/stories/:id | Story delete |
| GET | /api/chat | Inbox (conversations list) |
| GET | /api/chat/:userId | Kisi ek user se poori chat |
| POST | /api/chat/:userId | Message bhejo |
| GET | /api/notifications | Sari notifications |
| PUT | /api/notifications/:id/read | Ek notification read mark |
| PUT | /api/notifications/read-all | Sab read mark |

Sab routes (except register/login) ke liye header chahiye:
```
Authorization: Bearer <token>
```

## Real-time (Socket.io)
Client connect karte waqt token bhejna hoga:
```js
const socket = io("https://vibely-backend.onrender.com", {
  auth: { token: "<jwt_token>" }
});

socket.on("newNotification", (notif) => { ... });
socket.on("newMessage", (msg) => { ... });
```

## Android App Connect
`VibelyApp/app/src/main/java/com/ks/vibely/network/ApiService.kt` mein base URL is naye backend ke URL se replace karo. Route paths already match kar rahe hain, koi endpoint rename nahi karna padega.
