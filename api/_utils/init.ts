import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any, // Use latest or stable
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn("Firebase Admin not initialized. Webhooks may fail.");
    }
  }
}

export const db = admin.firestore();
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
