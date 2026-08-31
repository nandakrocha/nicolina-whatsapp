import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, remove, onValue, push } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Configuração do Firebase - VOCÊ PRECISA PREENCHER ESTAS CREDENCIAIS
// Acesse: https://console.firebase.google.com
// 1. Crie um projeto
// 2. Vá em "Project Settings" > "General"
// 3. Role até "Your apps" e clique no ícone Web (</>)
// 4. Copie as credenciais abaixo

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB4vlluwt_b4TAAMRi75Yt2ZER3W8d50tA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nicolina---teste-whatsapp.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nicolina---teste-whatsapp-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nicolina---teste-whatsapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nicolina---teste-whatsapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "592701719321",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:592701719321:web:653c9a5628465793947b88"
};

// Verificar se Firebase está configurado
export const isFirebaseConfigured = () => {
  return !firebaseConfig.apiKey.includes("PREENCHA");
};

// Promise que resolve quando a autenticação anônima for confirmada (ou falhar)
// Garante que isDatabaseAvailable() só é chamado após o auth estar pronto
let _authReadyResolve!: () => void;
export const authReadyPromise = new Promise<void>((resolve) => {
  _authReadyResolve = resolve;
});

// Inicializar Firebase
let app: any;
let database: any;
let storage: any;
let auth: any;
let _anonymousAuthReady = false;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);

    signInAnonymously(auth)
      .then(() => {
        console.log("✅ Firebase conectado com sucesso!");
      })
      .catch((error) => {
        console.error("❌ Erro na autenticação anônima:", error);
        _authReadyResolve(); // resolve mesmo com falha para não bloquear o app
      });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        _anonymousAuthReady = true;
        _authReadyResolve(); // autenticação confirmada — libera a sincronização
        console.group("🔐 Firebase Auth — Sessão atual");
        console.log("UID:         ", user.uid);
        console.log("isAnonymous: ", user.isAnonymous);
        console.log("providerId:  ", user.providerId);
        console.groupEnd();
      } else {
        _anonymousAuthReady = false;
        // user === null pode ocorrer antes de signInAnonymously terminar —
        // NÃO resolver authReadyPromise aqui; aguardar o usuário válido.
        console.warn("⚠️ Firebase Auth — nenhum usuário autenticado (aguardando signIn)");
      }
    });
  } else {
    console.log("💾 Firebase não configurado - usando armazenamento local");
    console.log("📖 Para configurar, vá em: ⚙️ Configurações → Instruções Firebase");
    _authReadyResolve(); // Firebase não configurado — resolve imediatamente
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
  database = null;
  storage = null;
  _authReadyResolve(); // erro na inicialização — resolve para não bloquear o app
}

// Função helper para verificar se database está disponível e autenticado
export const isDatabaseAvailable = () => {
  return database !== null && database !== undefined && _anonymousAuthReady;
};

// Função helper para verificar se storage está disponível
export const isStorageAvailable = () => {
  return storage !== null && storage !== undefined;
};

export { database, ref, set, get, update, remove, onValue, push, storage, storageRef, uploadBytes, getDownloadURL };