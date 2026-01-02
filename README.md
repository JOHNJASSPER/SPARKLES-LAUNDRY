# 🧺 Sparkles Laundry

A premium full-stack laundry and dry cleaning service web application with customer dashboards, order management, and crypto payment support.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

## ✨ Features

- 🔐 **User Authentication** - Email/password registration & login
- 📊 **Customer Dashboard** - View orders, track status, see spending stats
- 🛒 **Order System** - Select services, add items, real-time pricing
- 💳 **Crypto Payments** - USDT/Binance Pay support
- 🛡️ **Admin Panel** - Manage all orders, update statuses, view analytics
- 📱 **Responsive Design** - Works on mobile, tablet, desktop

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/JOHNJASSPER/SPARKLES-LAUNDRY.git
cd SPARKLES-LAUNDRY

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

Visit: http://localhost:3000

## ⚙️ Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sparkles-laundry
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@sparkles.com
```

## 📁 Project Structure

```
├── server.js           # Express server
├── models/             # MongoDB models
├── routes/             # API endpoints
├── middleware/         # Auth middleware
├── js/                 # Frontend JavaScript
├── css/                # Stylesheets
├── *.html              # Frontend pages
└── assets/             # Images and logos
```

## 🔗 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Login | `/login` | User login |
| Register | `/register` | Create account |
| Dashboard | `/dashboard` | Customer dashboard |
| Order | `/order` | Create new order |
| Checkout | `/checkout` | Crypto payment |
| Admin | `/admin` | Admin dashboard |

## 📞 Contact

- **Phone**: 08066374570
- **Email**: johnjasper0804@gmail.com
- **Location**: Road 3, Matt Estate, Odo Eran

## 📄 License

ISC
