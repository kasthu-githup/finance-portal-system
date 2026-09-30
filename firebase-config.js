import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyDLimifCA6ohQt6m9NGmNVcbwUZIGp4Oj8",
    authDomain: "finance-portal-6a027.firebaseapp.com",
    projectId: "finance-portal-6a027",
    storageBucket: "finance-portal-6a027.firebasestorage.app",
    messagingSenderId: "395370125168",
    appId: "1:395370125168:web:eb4afab56e3daaed9da1b5"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { app, auth };