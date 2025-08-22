# FinMate - Smart Expense Tracking

A comprehensive expense tracking web application built with vanilla JavaScript and Firebase, designed specifically for Indian users with full INR currency support.

## 🚀 Features

- **Smart Authentication**: Email/Password login
- **Real-time Transactions**: Add, edit, and delete income/expense transactions
- **Budget Management**: Set category-wise budgets with real-time tracking
- **Visual Insights**: Interactive charts and analytics with Chart.js
- **Indian Currency Support**: Full ₹ INR formatting and localization
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Secure**: Firebase Authentication with user data isolation

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Authentication + Firestore)
- **Charts**: Chart.js
- **Icons**: Font Awesome 6.1.1
- **Fonts**: Google Fonts (Poppins & Inter)

## 📋 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd FinMate
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. In your project, open `js/firebase-config.js` and paste your Firebase config object as provided by Firebase.

### 4. Local Development

Since this is a client-side only application, you can:

**Option 1: Simple HTTP Server**

```bash
# If you have Python installed
python -m http.server 8000

# If you have Node.js installed
npx serve .

# If you have PHP installed
php -S localhost:8000
```

**Option 2: VS Code Live Server**

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 📱 Usage

1. **Landing Page**: Visit `index.html` to see the landing page
2. **Sign Up**: Create an account with your email address
3. **Dashboard**: View your financial overview
4. **Transactions**: Add/manage your income and expenses
5. **Budgeting**: Set monthly budgets for different categories
6. **Insights**: View charts and analytics of your spending
7. **Profile**: Manage your account and view advanced analytics

## 🔐 Security

- Firebase security rules for user data isolation
- Client-side input validation
- Secure authentication with Firebase Auth

## 📁 Project Structure

```
FinMate/
├── index.html              # Landing page
├── assets/
│   └── logo.svg
├── css/                   # Stylesheets
├── html/                  # Application pages
├── js/
│   ├── firebase-config.js # Firebase setup
│   └── utils.js           # Utility functions
└── README.md
```

## 🚀 Deployment

### 1. Vercel Deployment Setup

1. **Sign up or log in to Vercel** at [vercel.com](https://vercel.com/).
2. **Import your repository:**
   - Click "New Project" and select your GitHub repo.
3. **Configure the project:**
   - For "Framework Preset" select **Other**.
   - Set the output/public directory to the project root (leave blank if `index.html` is in the root).
4. **Deploy:**
   - Click **Deploy** and wait for the build to finish.
   - Vercel will provide a live URL (e.g., `https://finmate-yourname.vercel.app`).

All Firebase Authentication and Firestore features will work as expected after deployment.

### 2. You can also use Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Deploy
firebase deploy
```

Other supported deployment options:

- Netlify
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs)
- [Font Awesome Icons](https://fontawesome.com/icons)

---

Built with ❤️ for smart financial management
