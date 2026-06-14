import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyD6EUqcE0cXD_IxwmAhi5x0tCpsN8DloN4',
  authDomain: 'belumi-1712f.firebaseapp.com',
  projectId: 'belumi-1712f',
  storageBucket: 'belumi-1712f.firebasestorage.app',
  messagingSenderId: '428023632321',
  appId: '1:428023632321:web:a264c41ee90efecba2df40',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

export const apiBaseUrl =
  import.meta.env.VITE_BELUMI_API_BASE_URL ||
  'https://api.belumi.site/api'

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function loginWithFirebase(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await credential.user.getIdToken(true)
  return syncFirebaseLogin(idToken)
}

export async function registerWithFirebase(fullName, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (fullName.trim()) {
    await updateProfile(credential.user, { displayName: fullName.trim() })
  }
  const idToken = await credential.user.getIdToken(true)
  return syncFirebaseLogin(idToken)
}

export async function logoutFirebase() {
  await signOut(auth)
}

export async function syncCurrentFirebaseUser(user) {
  if (!user) return null
  const idToken = await user.getIdToken(true)
  return syncFirebaseLogin(idToken)
}

async function syncFirebaseLogin(idToken) {
  return apiFetch('/auth/firebase-login', {
    method: 'POST',
    body: { idToken },
    token: idToken,
  })
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
  })

  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const data = await response.json()
      message = formatApiError(data, message)
    } catch {
      message = await response.text()
    }
    throw new Error(message || `Request failed with ${response.status}`)
  }

  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function formatApiError(data, fallback) {
  const baseMessage = data.message || data.detail || data.title || fallback
  const validationErrors = data.errors || data.Errors

  if (!validationErrors || typeof validationErrors !== 'object') {
    return baseMessage
  }

  const details = Object.entries(validationErrors)
    .flatMap(([field, errors]) => {
      const messages = Array.isArray(errors) ? errors : [errors]
      return messages
        .filter(Boolean)
        .map((error) => `${field}: ${String(error)}`)
    })
    .join('\n')

  return details ? `${baseMessage}\n${details}` : baseMessage
}
