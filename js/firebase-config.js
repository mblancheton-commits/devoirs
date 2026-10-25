let db = null;
try {
    const firebaseConfig = {
        apiKey: "AIzaSyBF72uEilOlNUnRB4_BqREpXCj6NvF4Mac",
        authDomain: "exoanglais-6dd43.firebaseapp.com",
        projectId: "exoanglais-6dd43",
        storageBucket: "exoanglais-6dd43.firebasestorage.app",
        messagingSenderId: "656075154329",
        appId: "1:656075154329:web:cfe7ccb130ae55da02a908",
        measurementId: "G-BWY78NT061"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch(e) {
    console.error("Firebase init:", e);
}

const urlBackendRender = "https://das-plateforme.onrender.com";
