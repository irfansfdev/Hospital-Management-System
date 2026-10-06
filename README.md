# 🏥 Hospital Management System

A modern **Hospital Management System** built with **Next.js** and **Supabase**, designed to manage hospital operations through dedicated dashboards for **Patients, Doctors, and Administrators**.

## 🚀 Live Demo

**🌐 [View Live Project]([Hospital Management System Live](https://irfan-hospital-management-system.vercel.app)**

> 💡 The live application opens on the login page. Use the demo credentials below to explore the Patient and Doctor dashboards without creating an account.

### 🔑 Demo Credentials

| Role          | Email                | Password                |
| ------------- | -------------------- | ----------------------- |
| 🧑‍🦽 Patient | `patient@hms.test` | `Password123` |
| 🧑‍⚕️ Doctor  | `doctor@hms.test`  | `Password123`  |

**Note:** These accounts are provided only for demonstration purposes.

## 🚀 Tech Stack

* **Next.js**
* **React**
* **Supabase**
* **JavaScript**
* **Tailwind CSS**
* **Supabase Authentication**
* **Supabase Database**

## 👥 User Roles

### 🧑‍⚕️ Doctor

Doctors can manage their medical workflow through a dedicated dashboard, including:

* View assigned patients
* Manage appointments
* View patient information
* Update appointment/consultation details
* Manage their doctor profile

### 👨‍💼 Admin

Administrators have control over the hospital management system, including:

* Manage doctors
* Manage patients
* Manage appointments
* Monitor hospital activities
* Manage system data
* Access administrative dashboard

### 🧑‍🦽 Patient

Patients can use their dashboard to:

* Register and manage their profile
* View available doctors
* Book appointments
* View appointment status
* Manage their appointments
* View relevant medical information

## ✨ Key Features

* 🔐 Authentication & role-based access
* 👨‍⚕️ Doctor management
* 🧑‍🦽 Patient management
* 📅 Appointment management
* 📊 Dedicated dashboards
* 🗄️ Supabase database integration
* 🔒 Secure data access
* 📱 Responsive interface
* ⚡ Next.js App Router
* 🔄 Real-time database capabilities through Supabase

## 📁 Project Structure

```text
Hospital-Management-System/
│
├── app/
│   ├── admin/
│   ├── doctor/
│   ├── patient/
│   └── ...
│
├── components/
├── lib/
├── public/
├── supabase/
├── .env.local
├── package.json
└── README.md
```

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/irfansfdev/Hospital-Management-System.git
```

Navigate to the project:

```bash
cd Hospital-Management-System
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🔑 Application Views

| Role          | Dashboard         |
| ------------- | ----------------- |
| 🧑‍🦽 Patient | Patient Dashboard |
| 🧑‍⚕️ Doctor  | Doctor Dashboard  |
| 👨‍💼 Admin   | Admin Dashboard   |

## 🎯 Project Goal

The goal of this project is to provide a centralized platform for managing hospital activities while giving **patients, doctors, and administrators** their own dedicated workflows and interfaces.

## 🛠️ Future Improvements

* Online payment integration
* Advanced medical records
* Prescription management
* Notifications
* Advanced analytics
* Telemedicine support

---

**Built with Next.js & Supabase.**
