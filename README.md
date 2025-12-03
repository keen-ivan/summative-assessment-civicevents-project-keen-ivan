#  Civic Events Frontend

This repository contains the **frontend implementation** for the **Civic Events Management System**. It is a **responsive, accessible web application** built with **HTML**, **Tailwind CSS**, and **jQuery** that consumes a RESTful backend API.

---

##  Project Overview

The Civic Events platform allows users to **discover, register for, and provide feedback** on community events. It features a comprehensive **role-based access control** system where **Administrators** can manage events, announcements, and users, while **standard Users** can interact with the content.

---

##  Key Features

* **Authentication:** Secure Signup and Login with **JWT token management**.
* **Role-Based Access:** Distinct interfaces and capabilities for **Admins vs. Users**.
* **Events Management:** View, search, filter, **create (Admin)**, and **delete (Admin)** events.
* **Registration:** Users can register for events and view/cancel their registrations.
* **Multimedia:** Audio announcements and video promos with **accessibility support** (captions).
* **Admin Dashboard:** Statistics overview and activity monitoring using **Chart.js**.
* **User Profile:** Self-service profile management and password updates.

---

##  Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Markup** | **HTML5** | Semantic markup for accessibility. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework for responsive design (via CDN). |
| **Scripting** | **jQuery** | DOM manipulation and AJAX API calls. |
| **Visualization** | **Chart.js** | Data visualization for the Admin Dashboard. |
| **Icons** | **FontAwesome** | Icons library. |

---

##  Setup & Installation

### Prerequisites

* A **modern web browser** (Chrome, Firefox, Edge).
* A **running instance of the Civic Events Backend API**.
* A **local web server** (e.g., VS Code Live Server).

### 1. Connect to the Backend

This frontend expects the backend API to be running locally.

* **Base URL:** `http://localhost:4000` (Default)
* **To change this:** Edit the `API_BASE_URL` constant in `frontend/assets/js/api.js`:
    ```javascript
    const API_BASE_URL = "http://localhost:4000";
    ```

### 2. Run the Frontend

1.  **Clone or download** this repository.
2.  Open the `frontend` folder in VS Code.
3.  Right-click `index.html` and select **"Open with Live Server"**.
4.  Navigate to `http://127.0.0.1:5500/frontend/index.html` in your browser.

---

##  Usage Guide

### User Roles & Credentials

To test the application effectively, you need accounts for both roles.

| Role | Creation Method | Capabilities |
| :--- | :--- | :--- |
| **Standard User** | Sign up via the "Sign Up" page. (Default role is `user`). | View events, register, view profile, play media. |
| **Administrator** | **Manually update** a user's role to `'admin'` in the **backend database** (`users` table). **Note:** There is no public signup for Admins. | Create/Edit/Delete events, upload media, view dashboard, manage users. |

### Feature Walkthrough

* **Login/Signup:** Validates inputs and redirects based on the user's role.
* **Events:** The main landing page. Use the search bar to filter events.
* **Admin Actions:** Log in as an Admin to see **"Create Event"** buttons and **"Delete"** options on event cards.
* **Dashboard:** Accessible **only to Admins** via the navigation bar.

---

##  Implementation Notes

* **Security:** All protected pages include a **client-side guard** (`Auth.requireLogin()` or `Auth.requireAdmin()`) that redirects unauthorized users.
* **API Handling:** A central `api.js` file manages all HTTP requests, automatically attaching the **JWT Authorization header**.
* **Accessibility:** **Semantic HTML tags** (`<nav>`, `<main>`, `<article>`) and **ARIA labels** are used throughout. Video players include track support for **captions**.

---

### Submission Details

* **Student Name:** Mucyo Ivan
* **Submission Date:** 27/09/205