import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin lazily
function getAdminApp() {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback for local dev or auto-init environments
      try {
        admin.initializeApp();
      } catch (e) {
        console.error("Firebase Admin could not initialize automatically. Check env vars.");
      }
    }
  }
  return admin.app();
}

// Lazy getters to prevent module-level crashes
export const getDb = () => {
  try {
    getAdminApp();
    return admin.firestore();
  } catch (e) {
    console.error("Firestore init failed:", e);
    return null as any;
  }
};

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("MISSING STRIPE_SECRET_KEY");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia' as any,
  });
};

export const getAi = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("MISSING GEMINI_API_KEY");
  }
  return new GoogleGenAI(process.env.GEMINI_API_KEY || '');
};
