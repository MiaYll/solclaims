import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDOUlKpI-Fd7pRT6AKJqwtse1xYCDhpvVU",
    authDomain: "solclaims-e0efd.firebaseapp.com",
    projectId: "solclaims-e0efd",
    storageBucket: "solclaims-e0efd.firebasestorage.app",
    messagingSenderId: "750643055392",
    appId: "1:750643055392:web:9bac2158664e310fd66545",
    measurementId: "G-JDGWYGDG6Y"
  };
  

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 获取 Firestore 实例
export const db = getFirestore(app); 