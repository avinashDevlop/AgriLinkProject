// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVlD5yzefdPfqkgmbMzmFH_JMyZEPT-z8",
  authDomain: "argilink.firebaseapp.com",
  databaseURL: "https://argilink-default-rtdb.firebaseio.com",
  projectId: "argilink",
  storageBucket: "argilink.firebasestorage.app",
  messagingSenderId: "581424374010",
  appId: "1:581424374010:web:29d09c37aab3cd40c32943",
  measurementId: "G-P9YDR48T2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// IPFS Configuration
const PINATA_API_KEY = 'bff931f3f2056928f073';
const PINATA_SECRET_KEY = '4731ef79e2c57855c0d32402afb21398f56319f73ddb32ddbaf07c5a3d2d2539';
const IPFS_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

// ==================== REALTIME DATABASE FUNCTIONS ====================

/**
 * Store user data in Realtime Database
 * Structure: users/{userType}/{state}/{district}/{phone}.json
 */
export const storeUserDataInRealtimeDB = async (userData) => {
  try {
    const { userType, state, district, phone, ...rest } = userData;
    
    // Sanitize keys for Firebase (remove special characters)
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const userRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
    
    await set(userRef, {
      ...rest,
      userType,
      state: sanitizedState,
      district: sanitizedDistrict,
      phone: sanitizedPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    console.log("User data stored in Realtime Database successfully");
    return true;
  } catch (error) {
    console.error("Error storing user data in Realtime DB:", error);
    throw error;
  }
};

/**
 * Get user data from Realtime Database
 */
export const getUserDataFromRealtimeDB = async (userType, state, district, phone) => {
  try {
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const userRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data from Realtime DB:", error);
    return null;
  }
};

/**
 * Update PM Kisan status in Realtime Database
 */
export const updatePMKisanStatusInRealtimeDB = async (userType, state, district, phone, pmKisanLinked, pmKisanData = null) => {
  try {
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const userRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
    
    const updates = {
      pmKisanLinked,
      pmKisanData: pmKisanData ? JSON.stringify(pmKisanData) : null,
      updatedAt: new Date().toISOString(),
    };
    
    await update(userRef, updates);
    console.log("PM Kisan status updated in Realtime Database");
    return true;
  } catch (error) {
    console.error("Error updating PM Kisan status:", error);
    throw error;
  }
};

/**
 * Update document verification in Realtime Database
 */
export const updateDocumentVerificationInRealtimeDB = async (
  userType, 
  state, 
  district, 
  phone, 
  documentHash, 
  localDocumentPath, 
  blockchainVerified, 
  ipfsVerified
) => {
  try {
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const userRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
    
    const updates = {
      documentHash,
      localDocumentPath,
      blockchainVerified,
      ipfsVerified,
      updatedAt: new Date().toISOString(),
      lastVerified: new Date().toISOString(),
    };
    
    await update(userRef, updates);
    console.log("Document verification updated in Realtime Database");
    return true;
  } catch (error) {
    console.error("Error updating document verification:", error);
    throw error;
  }
};

// ==================== FIRESTORE FUNCTIONS ====================

/**
 * Store verification data in Firestore
 */
export const storeVerificationData = async (verificationData) => {
  try {
    const { phone, ...data } = verificationData;
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const verificationRef = doc(firestore, 'verifications', sanitizedPhone);
    
    await setDoc(verificationRef, {
      ...data,
      phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log("Verification data stored in Firestore");
    return true;
  } catch (error) {
    console.error("Error storing verification data:", error);
    throw error;
  }
};

/**
 * Get user verification data from Firestore
 */
export const getUserVerificationData = async (phone) => {
  try {
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    const verificationRef = doc(firestore, 'verifications', sanitizedPhone);
    const docSnap = await getDoc(verificationRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting verification data:", error);
    return null;
  }
};

/**
 * Store verification proof in Firestore
 */
export const storeVerificationProof = async (phone, proofData) => {
  try {
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    const proofRef = doc(firestore, 'verificationProofs', sanitizedPhone);
    
    await setDoc(proofRef, {
      ...proofData,
      phone,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log("Verification proof stored in Firestore");
    return true;
  } catch (error) {
    console.error("Error storing verification proof:", error);
    throw error;
  }
};

// ==================== STORAGE FUNCTIONS ====================

/**
 * Upload file to Firebase Storage
 */
export const uploadToFirebase = async (fileUri, path) => {
  try {
    // Convert file URI to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Create storage reference
    const fileRef = storageRef(storage, path);
    
    // Upload file
    await uploadBytes(fileRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    console.log("File uploaded to Firebase Storage:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    throw error;
  }
};

// ==================== IPFS FUNCTIONS ====================

/**
 * Upload file to IPFS via Pinata
 */
export const uploadToIPFS = async (fileUri, fileName, metadata) => {
  try {
    // Convert file to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    // Add metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: fileName,
      keyvalues: metadata
    }));
    
    // Upload to Pinata
    const ipfsResponse = await axios.post(IPFS_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
    });
    
    const ipfsHash = ipfsResponse.data.IpfsHash;
    console.log("File uploaded to IPFS:", ipfsHash);
    
    return {
      ipfsHash,
      ipfsUrl: `${IPFS_GATEWAY_URL}/${ipfsHash}`,
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    
    // Fallback for demo/testing
    return {
      ipfsHash: `demo_ipfs_${Date.now()}`,
      ipfsUrl: `${IPFS_GATEWAY_URL}/demo_ipfs_${Date.now()}`,
      isDemo: true,
    };
  }
};

/**
 * Retrieve document from IPFS
 */
export const retrieveDocumentFromIPFS = async (ipfsHash) => {
  try {
    const response = await axios.get(`${IPFS_GATEWAY_URL}/${ipfsHash}`, {
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error("Error retrieving from IPFS:", error);
    throw error;
  }
};

// ==================== BLOCKCHAIN FUNCTIONS ====================

/**
 * Verify document on blockchain (simulated for now)
 */
export const verifyDocumentOnBlockchain = async (documentHash, phone) => {
  try {
    // This is a simulation - in production, integrate with actual blockchain
    const transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    console.log("Document verified on blockchain:", {
      documentHash,
      phone,
      transactionHash,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      transactionHash,
      timestamp: new Date().toISOString(),
      network: 'Polygon Mumbai Testnet',
      explorerUrl: `https://mumbai.polygonscan.com/tx/${transactionHash}`,
    };
  } catch (error) {
    console.error("Blockchain verification error:", error);
    throw error;
  }
};

// ==================== PM KISAN API INTEGRATION ====================

/**
 * Check PM Kisan eligibility (simulated for now)
 * Replace with actual API call in production
 */
export const getPMKisanEligibilityFromAPI = async (phone, state, district) => {
  try {
    // Simulated API call - Replace with actual PM Kisan API
    console.log("Checking PM Kisan eligibility for:", { phone, state, district });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes - 70% chance of being eligible
    const isEligible = Math.random() > 0.3;
    
    if (isEligible) {
      const pmKisanData = {
        isEligible: true,
        beneficiaryId: `PMKISAN${phone.substring(6)}${Date.now().toString(36).toUpperCase()}`,
        name: "Rajesh Kumar", // Would come from API
        aadhaarLinked: true,
        bankAccount: `XXXXXX${phone.substring(6)}`,
        ifscCode: "SBIN0001234",
        installmentStatus: [
          { installment: "13th", amount: "₹2000", status: "Credited", date: "15 Jan 2024" },
          { installment: "14th", amount: "₹2000", status: "Pending", date: "Expected Apr 2024" },
          { installment: "15th", amount: "₹2000", status: "Upcoming", date: "Expected Jul 2024" }
        ],
        totalReceived: "₹26,000",
        lastUpdated: new Date().toISOString(),
        state,
        district,
        isVerified: true,
        verificationDate: new Date().toISOString(),
      };
      
      // Store in Realtime Database
      const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
      const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
      const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
      
      const userRef = ref(database, `users/framer/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
      await update(userRef, {
        pmKisanLinked: true,
        pmKisanData: JSON.stringify(pmKisanData),
        updatedAt: new Date().toISOString(),
      });
      
      return pmKisanData;
    } else {
      return {
        isEligible: false,
        message: "Not registered in PM Kisan scheme",
      };
    }
  } catch (error) {
    console.error("Error checking PM Kisan eligibility:", error);
    
    // Fallback response for development
    return {
      isEligible: false,
      message: "Service temporarily unavailable. Please try again later.",
      error: error.message,
    };
  }
};

// ==================== USER MANAGEMENT FUNCTIONS ====================

/**
 * Get all users by location (for admin purposes)
 */
export const getUsersByLocation = async (userType, state, district) => {
  try {
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    
    const usersRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}`);
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error getting users by location:", error);
    return {};
  }
};

/**
 * Delete user data
 */
export const deleteUserData = async (userType, state, district, phone) => {
  try {
    const sanitizedState = state.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedDistrict = district.replace(/[.#$\/\[\]]/g, '_');
    const sanitizedPhone = phone.replace(/[.#$\/\[\]]/g, '_');
    
    const userRef = ref(database, `users/${userType}/${sanitizedState}/${sanitizedDistrict}/${sanitizedPhone}`);
    await remove(userRef);
    
    // Also delete from Firestore
    const verificationRef = doc(firestore, 'verifications', sanitizedPhone);
    await remove(verificationRef);
    
    console.log("User data deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};

// Realtime Database Functions
export const getUserProfileRealtime = async (userId) => {
  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfileRealtime = async (userId, updates) => {
  try {
    await update(ref(database, `users/${userId}`), {
      ...updates,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export const getProductsRealtime = (userId, callback) => {
  try {
    const productsRef = ref(database, `users/${userId}/products`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const products = Object.values(snapshot.val());
        callback(products);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up products listener:', error);
    // Return dummy unsubscribe function
    return () => {};
  }
};

export const getMediaRealtime = (userId, callback) => {
  try {
    const mediaRef = ref(database, `users/${userId}/media`);
    
    const unsubscribe = onValue(mediaRef, (snapshot) => {
      if (snapshot.exists()) {
        const media = Object.values(snapshot.val());
        callback(media);
      } else {
        callback([]);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up media listener:', error);
    // Return dummy unsubscribe function
    return () => {};
  }
};

// Export all services
export { 
  auth, 
  database, 
  firestore, 
  storage,
  firebaseConfig 
};
