# 🏥 Hospital Management System (HMS)

A full-stack Hospital Management System designed to streamline hospital operations, patient management, appointment scheduling, medical records, prescriptions, billing, and real-time communication between patients, doctors, and administrators.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based Authentication
- Role-Based Access Control (RBAC)
- Secure Login & Registration
- Multiple User Roles

### 👨‍⚕️ Doctor Management
- Doctor Profiles
- Specialization Management
- Availability Scheduling
- Patient Consultation Records

### 🧑‍🤝‍🧑 Patient Management
- Patient Registration
- Medical History Tracking
- Appointment Booking
- Health Record Management

### 📅 Appointment Management
- Book Appointments
- Reschedule Appointments
- Cancel Appointments
- Doctor Approval Workflow
- Appointment Status Tracking

### 📋 Medical Reports
- Upload Medical Reports
- X-Ray Reports
- MRI Reports
- CT Scan Reports
- Blood Test Reports
- ECG Reports
- Report Review Workflow

### 💊 Prescription Management
- Create Prescriptions
- View Prescription History
- Medicine Details Management

### 💰 Billing System
- Invoice Generation
- Payment Tracking
- Billing Records

### 📊 Admin Dashboard
- Hospital Statistics
- User Management
- Doctor Management
- Patient Management
- System Monitoring

### 🔔 Notifications
- Appointment Notifications
- Status Updates
- Real-Time Alerts

### ⚡ Real-Time Features
- Socket.IO Integration
- Live Notifications
- Real-Time Appointment Updates

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Prisma ORM
- SQLite / PostgreSQL
- JWT Authentication
- Socket.IO

### Development Tools
- Git & GitHub
- Postman
- Prisma Studio

---

## 📂 Project Structure

```
HMS/
├── client/                 # Frontend — React + Vite
│   ├── public/
│   ├── scripts/            # Dev utilities (e.g. replace-colors.cjs)
│   ├── src/
│   │   ├── api/            # Axios API clients
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/        # Auth, Socket, Theme providers
│   │   ├── pages/
│   │   ├── routes/
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js      # Proxies /api → http://localhost:5000
│
├── server/                 # Backend — Express + Prisma
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/            # Seed & diagnostic scripts
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── modules/        # auth, patient, doctor, appointment, prescription,
│   │   │                   # report, billing, lab, notification, admin, receptionist
│   │   ├── socket/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── package.json            # Root convenience scripts
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/KollimallaTriveni/Hospital-Management-System.git
cd Hospital-Management-System
```

### Server Setup

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed:demo        # optional: demo accounts
npm run dev              # http://localhost:5000
```

### Client Setup

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

### From the Repository Root

```bash
npm run install:all      # install server + client dependencies
npm run dev:server       # start the API
npm run dev:client       # start the frontend (in another terminal)
```

---

## 🌐 API Base URL

```
http://localhost:5000/api/v1
```

---

## 👥 User Roles

- Admin
- Doctor
- Patient
- Receptionist
- Pharmacist

---

## 📈 Future Enhancements

- AI Appointment Assistant
- AI Hospital Receptionist
- Voice Calling Integration
- WhatsApp Notifications
- Video Consultation
- Advanced Analytics Dashboard
- Electronic Health Records (EHR)

---

## 👩‍💻 Developer

**Kollimalla Triveni**
- LinkedIn: https://linkedin.com/in/triveni-kollimalla-425b2934a/
- GitHub: https://github.com/KollimallaTriveni

---

## 📜 License

This project is developed for educational, internship, and learning purposes.
