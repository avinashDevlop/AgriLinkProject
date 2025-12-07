import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Dimensions,
  FlatList,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  RefreshControl
} from 'react-native';
import { 
  Ionicons, 
  MaterialIcons, 
  Feather, 
  FontAwesome, 
  MaterialCommunityIcons,
  AntDesign,
  Entypo
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';

// Import Firebase functions
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove,
  push,
  onValue,
  off
} from 'firebase/database';
import { 
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { app } from '../../firebase';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Initialize Firebase services
const database = getDatabase(app);
const storage = getStorage(app);

// Local Storage Keys
const STORAGE_KEYS = {
  USER_DATA: '@agriprofile_user_data',
  USER_PROFILE: '@agriprofile_user_profile',
  PRODUCTS_DATA: '@agriprofile_products',
  PROFILE_IMAGE: '@agriprofile_image',
  LOCAL_IMAGES: '@agriprofile_local_images',
  USER_PATH: '@agriprofile_user_path'
};

// Helper function to get user data path
const getUserDataPath = (userType, state, district, phoneNumber) => {
  return `users/${userType}/${state}/${district}/${phoneNumber}`;
};

// COMPLETE PRODUCT DATABASE - ALL CATEGORIES
const DEFAULT_PRODUCT_IMAGES = {
  Seeds: [
    {
      uri: require('../../assets/Products/Seeds/Seed_brinjal.png'),
      name: 'Brinjal Seeds',
      title: 'Hybrid Brinjal (Eggplant) Premium Seeds',
      description: 'Premium hybrid brinjal seeds with high germination rate (95%). Disease-resistant variety perfect for tropical climates. Produces dark purple, oval-shaped fruits with excellent taste. Matures in 75-80 days. Suitable for both organic and conventional farming.',
      price: '450',
      quantity: '100',
      unit: 'g',
      rating: 4.7,
      reviews: 128,
      views: 1250,
      specifications: {
        type: 'Hybrid',
        germination: '95%',
        maturity: '75-80 days',
        season: 'Kharif, Rabi',
        sowingDepth: '0.5-1 cm',
        spacing: '60x60 cm'
      }
    },
    {
      uri: require('../../assets/Products/Seeds/Seed_tomato.png'),
      name: 'Tomato Seeds',
      title: 'F1 Hybrid Tomato Seeds - High Yield',
      description: 'F1 hybrid tomato seeds producing bright red, firm, round fruits. Each fruit weighs 100-120g. Resistant to ToLCV and bacterial wilt. Perfect for fresh market and processing. High yield potential of 40-50 tons per acre.',
      price: '650',
      quantity: '25',
      unit: 'g',
      rating: 4.8,
      reviews: 245,
      views: 2100,
      specifications: {
        type: 'F1 Hybrid',
        fruitWeight: '100-120g',
        yield: '40-50 tons/acre',
        maturity: '65-70 days',
        diseaseResistance: 'ToLCV, Bacterial Wilt'
      }
    },
    {
      uri: require('../../assets/Products/Seeds/Seed_chilli.png'),
      name: 'Chilli Seeds',
      title: 'Super Hot Hybrid Chilli Seeds',
      description: 'Extra hot hybrid chilli seeds with Scoville rating of 50,000-100,000 SHU. Produces long, slender, dark green chillies that turn bright red. Suitable for making pickles, sauces, and drying. High pungency and excellent aroma.',
      price: '380',
      quantity: '50',
      unit: 'g',
      rating: 4.6,
      reviews: 189,
      views: 1650,
      specifications: {
        type: 'Hybrid',
        pungency: '50,000-100,000 SHU',
        color: 'Green to Red',
        length: '12-15 cm',
        yield: '15-18 q/acre'
      }
    },
    {
      uri: require('../../assets/Products/Seeds/Seed_ladyfinger.png'),
      name: 'Ladyfinger Seeds',
      title: 'Pusa Sawani Okra (Ladyfinger) Seeds',
      description: 'Popular variety producing dark green, tender pods of 12-15cm length. Early maturing variety (45-50 days). Suitable for all seasons. High yielding with good market preference. Excellent for both home gardens and commercial cultivation.',
      price: '320',
      quantity: '100',
      unit: 'g',
      rating: 4.5,
      reviews: 156,
      views: 1450,
      specifications: {
        variety: 'Pusa Sawani',
        podLength: '12-15 cm',
        maturity: '45-50 days',
        color: 'Dark Green',
        plantingSeason: 'All seasons'
      }
    },
    {
      uri: require('../../assets/Products/Seeds/Seed_coriander.png'),
      name: 'Coriander Seeds',
      title: 'Organic Coriander (Dhania) Seeds',
      description: '100% organic coriander seeds with high germination rate. Slow bolting variety with abundant leaf production. Strong aroma and flavor. Suitable for both leaf and seed production. Grows well in pots and containers.',
      price: '280',
      quantity: '250',
      unit: 'g',
      rating: 4.4,
      reviews: 134,
      views: 1200,
      specifications: {
        type: 'Organic',
        germination: '90%',
        leafYield: '8-10 q/acre',
        seedYield: '6-8 q/acre',
        daysToHarvest: '30-40 days (leaf)'
      }
    }
  ],

  Tools: [
    {
      uri: require('../../assets/Products/Tools/Hoe.png'),
      name: 'Garden Hoe',
      title: 'Professional Steel Garden Hoe',
      description: 'Heavy-duty garden hoe made from high-carbon steel with 48" wooden handle. Perfect for weeding, cultivating, and soil preparation. Rust-resistant coating for durability. Ideal for vegetable gardens and small farms.',
      price: '850',
      quantity: '1',
      unit: 'piece',
      rating: 4.5,
      reviews: 89,
      views: 950,
      specifications: {
        material: 'High-Carbon Steel',
        handleLength: '48 inches',
        weight: '1.8 kg',
        bladeWidth: '15 cm',
        warranty: '1 year'
      }
    },
    {
      uri: require('../../assets/Products/Tools/Plough.png'),
      name: 'Hand Plough',
      title: 'Traditional Hand Plough',
      description: 'Traditional Indian hand plough (Hal) made from seasoned wood and steel. Perfect for small landholdings and terrace gardens. Easy to operate and maintain. Suitable for light tilling and furrow making.',
      price: '1250',
      quantity: '1',
      unit: 'piece',
      rating: 4.3,
      reviews: 67,
      views: 780,
      specifications: {
        material: 'Wood + Steel',
        length: '150 cm',
        weight: '4.5 kg',
        bladeType: 'Single',
        suitableFor: 'Small farms'
      }
    },
    {
      uri: require('../../assets/Products/Tools/Shovel.png'),
      name: 'Digging Shovel',
      title: 'Heavy Duty Digging Shovel',
      description: 'Professional digging shovel with reinforced steel blade and D-grip handle. Perfect for digging, trenching, and moving soil. Ergonomic design reduces back strain. Suitable for all soil types.',
      price: '950',
      quantity: '1',
      unit: 'piece',
      rating: 4.6,
      reviews: 102,
      views: 1100,
      specifications: {
        bladeMaterial: 'Reinforced Steel',
        handle: 'Fiberglass D-Grip',
        bladeSize: '30x25 cm',
        weight: '2.2 kg',
        capacity: '5 liters'
      }
    }
  ],

  Fertilizer: [
    {
      uri: require('../../assets/Products/Fertilizer/Fungicide.png'),
      name: 'Systemic Fungicide',
      title: 'Systemic Fungicide - Broad Spectrum',
      description: 'Broad-spectrum systemic fungicide effective against powdery mildew, downy mildew, rust, and leaf spot diseases. Preventive and curative action. Safe for most crops when used as directed.',
      price: '450',
      quantity: '250',
      unit: 'g',
      rating: 4.6,
      reviews: 178,
      views: 1650,
      specifications: {
        type: 'Systemic',
        diseases: 'Mildew, Rust, Leaf Spot',
        dosage: '2g per liter',
        waitingPeriod: '7 days',
        compatibleWith: 'Most insecticides'
      }
    },
    {
      uri: require('../../assets/Products/Fertilizer/Herbicide.png'),
      name: 'Selective Herbicide',
      title: 'Selective Herbicide - Grass Control',
      description: 'Post-emergence selective herbicide for controlling grasses in broadleaf crops. Effective against annual and perennial grasses. Does not harm most broadleaf crops when used properly.',
      price: '520',
      quantity: '500',
      unit: 'ml',
      rating: 4.5,
      reviews: 145,
      views: 1350,
      specifications: {
        type: 'Selective',
        target: 'Grasses',
        application: 'Post-emergence',
        dosage: '1-1.5 ml/liter',
        crops: 'Cotton, Soybean, Vegetables'
      }
    },
    {
      uri: require('../../assets/Products/Fertilizer/Insectiside.png'),
      name: 'Contact Insecticide',
      title: 'Broad Spectrum Contact Insecticide',
      description: 'Fast-acting contact insecticide effective against aphids, whiteflies, leafhoppers, and thrips. Knocks down pests within hours. Low toxicity to beneficial insects when used properly.',
      price: '380',
      quantity: '250',
      unit: 'ml',
      rating: 4.4,
      reviews: 167,
      views: 1550,
      specifications: {
        type: 'Contact',
        pests: 'Aphids, Whiteflies, Thrips',
        action: 'Knockdown',
        dosage: '1-2 ml/liter',
        safetyInterval: '3 days'
      }
    },
    {
      uri: require('../../assets/Products/Fertilizer/Pesticide.png'),
      name: 'Systemic Pesticide',
      title: 'Systemic Insecticide-Pesticide',
      description: 'Systemic pesticide with both contact and stomach action. Controls sucking and chewing pests. Provides protection for 10-15 days. Rainfast after 2 hours of application.',
      price: '580',
      quantity: '500',
      unit: 'g',
      rating: 4.7,
      reviews: 189,
      views: 1750,
      specifications: {
        action: 'Systemic + Contact',
        pests: 'Sucking & Chewing',
        protection: '10-15 days',
        rainfast: '2 hours',
        crops: 'All major crops'
      }
    },
    {
      uri: require('../../assets/Products/Fertilizer/Weedicide.jpg'),
      name: 'Non-Selective Weedicide',
      title: 'Non-Selective Weed Killer',
      description: 'Non-selective weedicide for total vegetation control. Effective against all types of weeds and grasses. Use for pre-planting weed control or in non-crop areas. Systemic action.',
      price: '420',
      quantity: '500',
      unit: 'ml',
      rating: 4.5,
      reviews: 134,
      views: 1250,
      specifications: {
        type: 'Non-selective',
        action: 'Systemic',
        application: 'Pre-planting',
        dosage: '10 ml/liter',
        waitPeriod: '7 days for planting'
      }
    }
  ],

  Equipment: [
    {
      uri: require('../../assets/Products/Equipment/Sprayer.png'),
      name: 'Knapsack Sprayer',
      title: '16L Knapsack Sprayer with Pressure Gauge',
      description: 'Professional 16L knapsack sprayer with pressure gauge and adjustable nozzle. Perfect for pesticide, herbicide, and fertilizer application. Comfortable back straps and leak-proof construction.',
      price: '1850',
      quantity: '1',
      unit: 'piece',
      rating: 4.7,
      reviews: 189,
      views: 1750,
      specifications: {
        capacity: '16 liters',
        pressure: '3-4 bar',
        nozzle: 'Adjustable',
        material: 'HDPE',
        warranty: '1 year'
      }
    },
    {
      uri: require('../../assets/Products/Equipment/Sprinkler System.png'),
      name: 'Sprinkler Irrigation',
      title: 'Complete Sprinkler Irrigation System',
      description: 'Complete sprinkler irrigation system covering up to 500 sq.m. Includes PVC pipes, sprinkler heads, connectors, and timer. Saves water and ensures uniform irrigation.',
      price: '4500',
      quantity: '1',
      unit: 'set',
      rating: 4.8,
      reviews: 156,
      views: 1650,
      specifications: {
        coverage: '500 sq.m',
        pressure: '2-3 kg/cm²',
        sprinklers: '8 pieces',
        pipe: 'PVC 50mm',
        waterSavings: '30-40%'
      }
    },
    {
      uri: require('../../assets/Products/Equipment/Water Pump.png'),
      name: 'Water Pump',
      title: '1HP Electric Water Pump',
      description: '1HP electric water pump with 3000LPH capacity. Suitable for irrigation, water transfer, and domestic use. Energy efficient with thermal overload protection.',
      price: '3800',
      quantity: '1',
      unit: 'piece',
      rating: 4.6,
      reviews: 167,
      views: 1580,
      specifications: {
        power: '1 HP',
        capacity: '3000 LPH',
        head: '20 meters',
        voltage: '230V',
        warranty: '2 years'
      }
    },
  ]
};

// Combine ALL products from all categories into one array with proper indexing
const ALL_PRODUCTS = (() => {
  const allProducts = [];
  let globalIndex = 0;
  
  // Combine products from all categories
  Object.keys(DEFAULT_PRODUCT_IMAGES).forEach(category => {
    DEFAULT_PRODUCT_IMAGES[category].forEach(product => {
      allProducts.push({
        ...product,
        category: category, // Keep original category
        originalCategory: category, // Store original category
        globalIndex: globalIndex++ // Add unique global index
      });
    });
  });
  
  return allProducts;
})();

// Helper function to get products by category
const getProductsByCategory = (category) => {
  if (category === 'All') {
    return ALL_PRODUCTS;
  }
  return ALL_PRODUCTS.filter(product => product.category === category);
};

// Get a random image from category
const getRandomProductImage = (category) => {
  const images = DEFAULT_PRODUCT_IMAGES[category] || DEFAULT_PRODUCT_IMAGES['Seeds'];
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex].uri;
};

// Generate dummy data based on image selection
const generateDummyDataForImage = (imageInfo, category) => {
  // If the image already has complete data, use it
  if (imageInfo.title && imageInfo.price && imageInfo.category) {
    return {
      title: imageInfo.title,
      description: imageInfo.description,
      price: imageInfo.price,
      category: imageInfo.category || category,
      quantity: imageInfo.quantity,
      unit: imageInfo.unit,
      rating: imageInfo.rating || 4.5,
      reviews: imageInfo.reviews || Math.floor(Math.random() * 200) + 50,
      views: imageInfo.views || Math.floor(Math.random() * 2000) + 1000,
      specifications: imageInfo.specifications || {}
    };
  }

  // Fallback data
  const categoryFallbacks = {
    'Seeds': { price: '150', quantity: '100', unit: 'g' },
    'Tools': { price: '500', quantity: '1', unit: 'piece' },
    'Fertilizer': { price: '300', quantity: '500', unit: 'g' },
    'Equipment': { price: '2500', quantity: '1', unit: 'piece' }
  };

  const fallback = categoryFallbacks[category] || { price: '150', quantity: '1', unit: 'piece' };

  return {
    title: imageInfo.name || `${category} Product`,
    description: imageInfo.description || `Premium quality ${category.toLowerCase()} for agricultural use. Best in class with excellent results.`,
    price: fallback.price,
    category: category,
    quantity: fallback.quantity,
    unit: fallback.unit,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 200) + 50,
    views: Math.floor(Math.random() * 2000) + 1000,
    specifications: {}
  };
};

// Firebase Helper Functions with structured path
const firebaseFunctions = {
  // Get complete user path
  getUserDataPath: (userType, state, district, phoneNumber) => {
    return `users/${userType}/${state}/${district}/${phoneNumber}`;
  },

  // Get user data from Firebase with structured path
  getUserDataFromRealtimeDB: async (userType, state, district, phoneNumber) => {
    try {
      const userPath = getUserDataPath(userType, state, district, phoneNumber);
      const userRef = ref(database, userPath);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Update user data with structured path
  updateUserDataInRealtimeDB: async (userType, state, district, phoneNumber, data) => {
    try {
      const userPath = getUserDataPath(userType, state, district, phoneNumber);
      const userRef = ref(database, userPath);
      await update(userRef, {
        ...data,
        updatedAt: Date.now(),
        lastUpdated: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  },

  // Get products with structured path
  getProductsFromRealtimeDB: async (userType, state, district, phoneNumber) => {
    try {
      const productsPath = `${getUserDataPath(userType, state, district, phoneNumber)}/products`;
      const productsRef = ref(database, productsPath);
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const products = [];
        snapshot.forEach((childSnapshot) => {
          products.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return products;
      }
      return [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  },

  // Add product with structured path
  addProductToRealtimeDB: async (userType, state, district, phoneNumber, productData) => {
    try {
      const productsPath = `${getUserDataPath(userType, state, district, phoneNumber)}/products`;
      const productsRef = ref(database, productsPath);
      const newProductRef = push(productsRef);
      
      const productWithMeta = {
        ...productData,
        id: newProductRef.key,
        userType: userType,
        state: state,
        district: district,
        phoneNumber: phoneNumber,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdDate: new Date().toISOString()
      };
      
      await set(newProductRef, productWithMeta);
      
      return { success: true, productId: newProductRef.key, product: productWithMeta };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
  },

  // Update product with structured path
  updateProductInRealtimeDB: async (userType, state, district, phoneNumber, productId, updates) => {
    try {
      const productPath = `${getUserDataPath(userType, state, district, phoneNumber)}/products/${productId}`;
      const productRef = ref(database, productPath);
      await update(productRef, {
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  },

  // Delete product with structured path
  deleteProductFromRealtimeDB: async (userType, state, district, phoneNumber, productId) => {
    try {
      const productPath = `${getUserDataPath(userType, state, district, phoneNumber)}/products/${productId}`;
      const productRef = ref(database, productPath);
      await remove(productRef);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  },

  // Upload to Firebase Storage with structured path
  uploadToFirebaseStorage: async (fileUri, path, onProgress = null) => {
    try {
      // Read the file
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Create storage reference with the path
      const storageReference = storageRef(storage, path);
      
      // Start the upload
      const uploadTask = uploadBytesResumable(storageReference, blob);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL after upload completes
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw error;
    }
  },

  // Setup realtime listener with structured path
  setupRealtimeListener: (userType, state, district, phoneNumber, path, callback) => {
    const dbPath = `${getUserDataPath(userType, state, district, phoneNumber)}/${path}`;
    const dbRef = ref(database, dbPath);
    
    const onDataChange = (snapshot) => {
      if (snapshot.exists()) {
        const data = [];
        snapshot.forEach((childSnapshot) => {
          data.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        callback(data);
      } else {
        callback([]);
      }
    };
    
    onValue(dbRef, onDataChange);
    
    return () => off(dbRef, 'value', onDataChange);
  }
};

const ProfileScreen = ({ navigation, route }) => {
  // Get user data from navigation params
  const userDataFromLogin = route?.params || {};
  
  // Extract user details with fallbacks
  const [userType, setUserType] = useState(userDataFromLogin?.userType || 'framer');
  const [state, setState] = useState(userDataFromLogin?.location?.state || 'Maharashtra');
  const [district, setDistrict] = useState(userDataFromLogin?.location?.district || 'Pune');
  const [phoneNumber, setPhoneNumber] = useState(userDataFromLogin?.phone || '+919876543210');
  
  // Generate user ID from phone number (remove + and spaces)
  const userId = phoneNumber.replace(/[+\s]/g, '');
  
  // User Data States
  const [userData, setUserData] = useState({
    name: 'Farmer',
    bio: 'Organic Farmer | Seed Supplier | Sustainable Agriculture Advocate',
    location: `${district}, ${state}`,
    website: 'www.organicseedshub.com',
    stats: {
      products: 0,
      followers: 10,
      following: 6
    },
    highlights: [
      { id: '1', title: 'Seeds', icon: 'sprout', isActive: true },
      { id: '2', title: 'Tools', icon: 'hammer', isActive: false },
      { id: '3', title: 'Fertilizer', icon: 'flask', isActive: false },
      { id: '4', title: 'Equipment', icon: 'wrench', isActive: false },
    ],
    phone: phoneNumber,
    userType: userType,
    state: state,
    district: district,
    ...userDataFromLogin
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Profile States
  const [profileImage, setProfileImage] = useState(require('../../assets/iconAndSplash.png'));
  const [profileImageUri, setProfileImageUri] = useState(null);
  
  // Products States
  const [products, setProducts] = useState([]);
  
  // Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  
  // Form States
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });
  
  // State to track current images in the picker
  const [currentCategoryImages, setCurrentCategoryImages] = useState(ALL_PRODUCTS);
  
  // Initialize new product with default data from ALL products
  const [newProduct, setNewProduct] = useState(() => {
    const firstProduct = ALL_PRODUCTS[0];
    const dummyData = generateDummyDataForImage(firstProduct, firstProduct.category);
    
    return {
      title: dummyData.title,
      description: dummyData.description,
      price: dummyData.price,
      category: 'All', // Start with "All" category
      quantity: dummyData.quantity,
      unit: dummyData.unit,
      selectedImageIndex: 0,
      selectedImageGlobalIndex: firstProduct.globalIndex,
      rating: dummyData.rating,
      reviews: dummyData.reviews,
      views: dummyData.views,
      specifications: dummyData.specifications || {}
    };
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState(() => {
    return ALL_PRODUCTS[0].uri;
  });
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs
  const scrollViewRef = useRef();

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Setup realtime listeners for products
  useEffect(() => {
    if (userType && state && district && phoneNumber) {
      let unsubscribeProducts = () => {};
      
      unsubscribeProducts = firebaseFunctions.setupRealtimeListener(
        userType, state, district, phoneNumber, 'products', 
        (data) => {
          setProducts(data);
          updateUserStats('products', data.length);
          AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_DATA, JSON.stringify(data));
        }
      );
      
      return () => {
        unsubscribeProducts();
      };
    }
  }, [userType, state, district, phoneNumber]);

  // Load user data from local storage first, then Firebase
  const loadUserData = async () => {
    setLoading(true);
    try {
      // First, try to load from local storage
      await loadFromLocalStorage();
      
      // Then, try to get from Firebase Realtime Database
      const dbUserData = await firebaseFunctions.getUserDataFromRealtimeDB(
        userType, state, district, phoneNumber
      );
      
      if (dbUserData) {
        // Merge with existing data
        const mergedData = {
          ...userData,
          ...dbUserData,
          stats: {
            ...userData.stats,
            ...(dbUserData.stats || {})
          }
        };
        
        setUserData(mergedData);
        
        // Set form values for editing
        setEditForm({
          name: mergedData.name || '',
          bio: mergedData.bio || '',
          location: mergedData.location || '',
          website: mergedData.website || ''
        });
        
        // Load profile image
        if (mergedData.profileImage) {
          setProfileImageUri(mergedData.profileImage);
        } else if (mergedData.localProfileImage) {
          setProfileImageUri(mergedData.localProfileImage);
        }
        
        // Save user path for future reference
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PATH, JSON.stringify({
          userType,
          state,
          district,
          phoneNumber
        }));
      }
      
      // Load products
      const productsData = await firebaseFunctions.getProductsFromRealtimeDB(
        userType, state, district, phoneNumber
      );
      setProducts(productsData);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      await loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Load data from local storage
  const loadFromLocalStorage = async () => {
    try {
      // Load user profile
      const savedUserProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (savedUserProfile) {
        const data = JSON.parse(savedUserProfile);
        setUserData(prev => ({
          ...prev,
          ...data
        }));
        setEditForm({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || ''
        });
      }
      
      // Load user data
      const savedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (savedUserData) {
        const data = JSON.parse(savedUserData);
        setUserData(prev => ({
          ...prev,
          ...data
        }));
      }
      
      // Load products
      const savedProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS_DATA);
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
      
      // Load profile image
      const savedProfileImage = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
      if (savedProfileImage) {
        setProfileImageUri(savedProfileImage);
      }
      
      // Load user path
      const savedUserPath = await AsyncStorage.getItem(STORAGE_KEYS.USER_PATH);
      if (savedUserPath) {
        const pathData = JSON.parse(savedUserPath);
        setUserType(pathData.userType || userType);
        setState(pathData.state || state);
        setDistrict(pathData.district || district);
        setPhoneNumber(pathData.phoneNumber || phoneNumber);
      }
      
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  };

  // Update user stats
  const updateUserStats = async (statKey, value) => {
    try {
      const updatedUserData = {
        ...userData,
        stats: {
          ...userData.stats,
          [statKey]: value
        }
      };
      
      setUserData(updatedUserData);
      
      // Update in Firebase with structured path
      await firebaseFunctions.updateUserDataInRealtimeDB(
        userType, state, district, phoneNumber, {
          stats: updatedUserData.stats
        }
      );
      
      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUserData));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
      
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
      const productsData = await firebaseFunctions.getProductsFromRealtimeDB(
        userType, state, district, phoneNumber
      );
      setProducts(productsData);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        Alert.alert(
          'Update Profile Picture',
          'Do you want to update your profile picture?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upload', 
              onPress: () => uploadProfileImage(selectedImage.uri)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload profile image with local storage AND Firebase Storage
  const uploadProfileImage = async (imageUri) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Save image locally first
      const timestamp = Date.now();
      const localFileName = `profile_${phoneNumber}_${timestamp}.jpg`;
      
      // Update local state immediately
      setProfileImageUri(imageUri);
      
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, imageUri);
      
      // Upload to Firebase Storage with proper path structure
      const fileName = `profile_${phoneNumber}_${timestamp}.jpg`;
      const storagePath = `profile_images/${userType}/${state}/${district}/${phoneNumber}/${fileName}`;
      
      const downloadUrl = await firebaseFunctions.uploadToFirebaseStorage(
        imageUri, 
        storagePath, 
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Update user profile with both URLs
      const updateData = {
        profileImage: downloadUrl,
        localProfileImage: imageUri,
        profileImageUpdatedAt: Date.now(),
        profileImagePath: storagePath,
        profileImageStorageUrl: downloadUrl
      };
      
      // Update in Firebase Realtime Database
      const success = await firebaseFunctions.updateUserDataInRealtimeDB(
        userType, state, district, phoneNumber, updateData
      );
      
      if (success) {
        console.log('Profile image data saved to Firebase Realtime Database');
      }
      
      // Update local storage
      const updatedUserData = {
        ...userData,
        ...updateData
      };
      
      setUserData(updatedUserData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUserData));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
      
      Alert.alert('Success', 'Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Upload Complete', 'Profile picture saved locally. Will sync when online.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Edit profile
  const handleEditProfile = () => {
    // Pre-fill form with existing data
    setEditForm({
      name: userData.name || '',
      bio: userData.bio || '',
      location: userData.location || '',
      website: userData.website || ''
    });
    setEditModalVisible(true);
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    
    try {
      const updates = {
        name: editForm.name,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        updatedAt: Date.now(),
        lastUpdated: new Date().toISOString()
      };

      // Update in Firebase with structured path
      const success = await firebaseFunctions.updateUserDataInRealtimeDB(
        userType, state, district, phoneNumber, updates
      );
      
      if (success) {
        // Update local state
        const updatedUserData = { ...userData, ...updates };
        setUserData(updatedUserData);
        
        // Update local storage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUserData));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
        
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Add product
  const handleAddProduct = () => {
    const firstProduct = ALL_PRODUCTS[0];
    const dummyData = generateDummyDataForImage(firstProduct, firstProduct.category);
    
    setNewProduct({
      title: dummyData.title,
      description: dummyData.description,
      price: dummyData.price,
      category: 'All',
      quantity: dummyData.quantity,
      unit: dummyData.unit,
      selectedImageIndex: 0,
      selectedImageGlobalIndex: firstProduct.globalIndex,
      rating: dummyData.rating,
      reviews: dummyData.reviews,
      views: dummyData.views,
      specifications: dummyData.specifications || {}
    });
    setSelectedProductImage(firstProduct.uri);
    setCurrentCategoryImages(ALL_PRODUCTS);
    setAddProductModalVisible(true);
  };

  // Handle category change
  const handleCategoryChange = async (category) => {
    // Get images for the selected category (or all if 'All' is selected)
    const filteredImages = getProductsByCategory(category);
    
    setCurrentCategoryImages(filteredImages);
    
    if (filteredImages.length > 0) {
      const firstImage = filteredImages[0];
      setSelectedProductImage(firstImage.uri);
      
      // Generate dummy data for the first image
      const dummyData = generateDummyDataForImage(firstImage, category === 'All' ? firstImage.category : category);
      
      setNewProduct(prev => ({
        ...prev,
        title: dummyData.title,
        description: dummyData.description,
        price: dummyData.price,
        quantity: dummyData.quantity,
        unit: dummyData.unit,
        category: category === 'All' ? firstImage.category : category,
        selectedImageIndex: 0,
        selectedImageGlobalIndex: firstImage.globalIndex,
        rating: dummyData.rating,
        reviews: dummyData.reviews,
        views: dummyData.views,
        specifications: firstImage.specifications || {}
      }));
    }
  };

  // Handle product image selection from current category images
  const handleSelectProductImage = async (imageInfo, index) => {
    setSelectedProductImage(imageInfo.uri);
    
    // Generate and fill dummy data based on selected image
    const dummyData = generateDummyDataForImage(imageInfo, imageInfo.category);
    
    setNewProduct(prev => ({
      ...prev,
      title: dummyData.title,
      description: dummyData.description,
      price: dummyData.price,
      quantity: dummyData.quantity,
      unit: dummyData.unit,
      category: imageInfo.category, // Set the category from the selected image
      selectedImageIndex: index,
      selectedImageGlobalIndex: imageInfo.globalIndex,
      rating: dummyData.rating,
      reviews: dummyData.reviews,
      views: dummyData.views,
      specifications: imageInfo.specifications || {} // Include specifications
    }));
  };

  // Function to convert asset URI to file URI
  const convertAssetUriToFile = async (assetUri) => {
    try {
      // For React Native asset URIs (require() images)
      if (typeof assetUri === 'number') {
        // Get the asset info
        const asset = Image.resolveAssetSource(assetUri);
        if (asset && asset.uri) {
          return asset.uri;
        }
      }
      // For string URIs
      return assetUri;
    } catch (error) {
      console.error('Error converting asset URI:', error);
      return assetUri;
    }
  };

  // Save product with image upload to Firebase Storage
  const handleSaveProduct = async () => {
    if (!newProduct.title.trim() || !newProduct.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Get the selected image from ALL_PRODUCTS using the global index
      const selectedImage = ALL_PRODUCTS.find(img => img.globalIndex === newProduct.selectedImageGlobalIndex) || ALL_PRODUCTS[0];
      
      if (!selectedImage) {
        throw new Error('Selected image not found');
      }
      
      // Convert asset URI to file URI
      const imageUri = await convertAssetUriToFile(selectedImage.uri);
      
      // Save image locally
      let localImageUri = null;
      let firebaseImageUrl = null;
      let storagePath = null;
      
      if (imageUri) {
        const timestamp = Date.now();
        const localFileName = `product_${phoneNumber}_${timestamp}.jpg`;
        
        // Upload to Firebase Storage with proper structured path
        const firebaseFileName = `product_${phoneNumber}_${timestamp}.jpg`;
        storagePath = `product_images/${userType}/${state}/${district}/${phoneNumber}/${selectedImage.category}/${firebaseFileName}`;
        
        try {
          firebaseImageUrl = await firebaseFunctions.uploadToFirebaseStorage(
            imageUri,
            storagePath,
            (progress) => {
              setUploadProgress(progress);
            }
          );
          console.log('Product image uploaded successfully:', firebaseImageUrl);
        } catch (uploadError) {
          console.error('Error uploading product image to Firebase:', uploadError);
          Alert.alert('Upload Warning', 'Product saved locally but could not upload image to cloud. Will try again later.');
        }
      }

      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        price: `₹${newProduct.price}`,
        category: selectedImage.category, // Use the actual category from the image
        quantity: newProduct.quantity,
        unit: newProduct.unit,
        imageName: selectedImage.name,
        imageIndex: newProduct.selectedImageIndex,
        globalImageIndex: newProduct.selectedImageGlobalIndex,
        localImageUri: localImageUri,
        firebaseImageUrl: firebaseImageUrl,
        storagePath: storagePath,
        localImageSaved: !!localImageUri,
        firebaseImageSaved: !!firebaseImageUrl,
        status: 'active',
        isAvailable: true,
        rating: newProduct.rating || 4.5,
        reviews: newProduct.reviews || Math.floor(Math.random() * 200) + 50,
        views: newProduct.views || Math.floor(Math.random() * 2000) + 1000,
        specifications: selectedImage.specifications || {},
        // Additional metadata
        originalCategory: selectedImage.originalCategory || selectedImage.category,
        tags: [selectedImage.category.toLowerCase(), selectedImage.name.toLowerCase().split(' ')[0]],
        sellerLocation: `${state}, ${district}`,
        sellerPhone: phoneNumber,
        sellerName: userData.name || 'Farmer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Product status
        isVerified: true,
        isFeatured: false,
        stock: Math.floor(Math.random() * 50) + 10,
        discount: Math.random() > 0.7 ? '10%' : '0%',
        shippingAvailable: true,
        returnPolicy: '7 days',
        warranty: 'Manufacturer warranty'
      };

      // Add to Firebase Realtime Database
      const result = await firebaseFunctions.addProductToRealtimeDB(
        userType, state, district, phoneNumber, productData
      );
      
      if (result.success) {
        console.log('Product saved to Firebase Realtime Database:', result.productId);
        
        // Update local storage
        const updatedProducts = [...products, result.product];
        setProducts(updatedProducts);
        await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_DATA, JSON.stringify(updatedProducts));
        
        Alert.alert(
          'Success', 
          `Product "${newProduct.title}" added successfully!${
            firebaseImageUrl ? '\nImage uploaded to cloud storage.' : '\nImage saved locally.'
          }`
        );
        setAddProductModalVisible(false);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', `Failed to add product: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await firebaseFunctions.deleteProductFromRealtimeDB(
                userType, state, district, phoneNumber, productId
              );
              
              if (success) {
                // Update local storage
                const updatedProducts = products.filter(p => p.id !== productId);
                setProducts(updatedProducts);
                await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS_DATA, JSON.stringify(updatedProducts));
                
                Alert.alert('Success', 'Product deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete product');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  // Share profile
  const handleShareProfile = async () => {
    try {
      const shareUrl = `https://agrilink.app/profile/${userType}/${state}/${district}/${phoneNumber}`;
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert('Copied!', 'Profile link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Could not copy link');
    }
  };

  // Render product item
  const renderProductItem = ({ item }) => {
    // Get image source - prioritize Firebase URL, then local image, then default
    let imageSource;
    if (item.firebaseImageUrl) {
      imageSource = { uri: item.firebaseImageUrl };
    } else if (item.localImageUri) {
      imageSource = { uri: item.localImageUri };
    } else if (item.imageUri && typeof item.imageUri === 'string') {
      imageSource = { uri: item.imageUri };
    } else if (item.imageUri && typeof item.imageUri === 'number') {
      imageSource = item.imageUri;
    } else {
      // Fallback to default image based on category
      const categoryImages = DEFAULT_PRODUCT_IMAGES[item.category] || DEFAULT_PRODUCT_IMAGES['Seeds'];
      if (categoryImages && categoryImages[0]) {
        imageSource = categoryImages[0].uri;
      } else {
        imageSource = ALL_PRODUCTS[0].uri;
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => {
          setSelectedProduct(item);
          setProductDetailModalVisible(true);
        }}
        onLongPress={() => handleDeleteProduct(item.id)}
      >
        <Image source={imageSource} style={styles.gridImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.productPrice}>{item.price || '₹0'}</Text>
          <View style={styles.productCategoryBadge}>
            <Text style={styles.productCategoryText}>{item.category}</Text>
          </View>
        </View>
        {item.firebaseImageSaved && (
          <View style={styles.cloudBadge}>
            <MaterialIcons name="cloud-done" size={12} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render product image picker
  const renderProductImagePicker = () => {
    return (
      <View style={styles.imagePickerContainer}>
        <View style={styles.imagePickerHeader}>
          <Text style={styles.imagePickerLabel}>Select Product Image</Text>
          <Text style={styles.selectedCategory}>
            {currentCategoryImages.length} products available
            {newProduct.category !== 'All' ? ` in ${newProduct.category}` : ' across all categories'}
          </Text>
        </View>
        
        {currentCategoryImages[newProduct.selectedImageIndex] && (
          <Text style={styles.imageInfoText}>
            {currentCategoryImages[newProduct.selectedImageIndex]?.name || 'Select an image'}
            <Text style={styles.categoryBadgeText}>
              {' '}({currentCategoryImages[newProduct.selectedImageIndex]?.category})
            </Text>
          </Text>
        )}
        
        <FlatList
          data={currentCategoryImages}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.imageOption,
                newProduct.selectedImageIndex === index && styles.imageOptionSelected
              ]}
              onPress={() => handleSelectProductImage(item, index)}
            >
              <View style={styles.imageOptionContainer}>
                <Image source={item.uri} style={styles.imageOptionThumbnail} />
                {newProduct.selectedImageIndex === index && (
                  <View style={styles.selectedOverlay}>
                    <AntDesign name="check" size={20} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.imageNameText} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `${item.name}-${item.globalIndex}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagePickerList}
        />
      </View>
    );
  };

  // Render edit modal
  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <AntDesign name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                placeholder="Enter your name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.bio}
                onChangeText={(text) => setEditForm({...editForm, bio: text})}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editForm.location}
                onChangeText={(text) => setEditForm({...editForm, location: text})}
                placeholder="Enter your location"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={editForm.website}
                onChangeText={(text) => setEditForm({...editForm, website: text})}
                placeholder="Enter website URL"
                keyboardType="url"
              />
            </View>
            
            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User Type:</Text>
                <Text style={styles.infoValue}>{userType}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoValue}>{state}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>District:</Text>
                <Text style={styles.infoValue}>{district}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{phoneNumber}</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render add product modal
  const renderAddProductModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={addProductModalVisible}
      onRequestClose={() => setAddProductModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            <TouchableOpacity onPress={() => setAddProductModalVisible(false)}>
              <AntDesign name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    newProduct.category === 'All' && styles.categoryChipSelected
                  ]}
                  onPress={() => handleCategoryChange('All')}
                >
                  <Text style={[
                    styles.categoryText,
                    newProduct.category === 'All' && styles.categoryTextSelected
                  ]}>
                    All Products
                  </Text>
                </TouchableOpacity>
                
                {Object.keys(DEFAULT_PRODUCT_IMAGES).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      newProduct.category === category && styles.categoryChipSelected
                    ]}
                    onPress={() => handleCategoryChange(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      newProduct.category === category && styles.categoryTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Product Image Preview */}
            <View style={styles.imagePreviewContainer}>
              {selectedProductImage && (
                <Image source={selectedProductImage} style={styles.imagePreview} />
              )}
              {uploading && (
                <View style={styles.uploadProgressContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.uploadProgressText}>
                    {uploadProgress > 0 ? `Uploading: ${Math.round(uploadProgress)}%` : 'Preparing upload...'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Image Picker */}
            {renderProductImagePicker()}
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={newProduct.title}
                onChangeText={(text) => setNewProduct({...newProduct, title: text})}
                placeholder="Enter product name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                placeholder="Product description"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({...newProduct, price: text})}
                placeholder="Enter price"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={newProduct.quantity}
                  onChangeText={(text) => setNewProduct({...newProduct, quantity: text})}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitPicker}>
                  {['kg', 'g', 'piece', 'ml', 'L', 'set'].map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitChip,
                        newProduct.unit === unit && styles.unitChipSelected
                      ]}
                      onPress={() => setNewProduct({...newProduct, unit})}
                    >
                      <Text style={[
                        styles.unitText,
                        newProduct.unit === unit && styles.unitTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.userInfoSection}>
              <Text style={styles.sectionTitle}>Product Location</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User Type:</Text>
                <Text style={styles.infoValue}>{userType}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoValue}>{state}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>District:</Text>
                <Text style={styles.infoValue}>{district}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{phoneNumber}</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => setAddProductModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveProduct}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                    {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Adding...'}
                  </Text>
                </>
              ) : (
                <Text style={styles.saveButtonText}>Add Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render product detail modal
  const renderProductDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={productDetailModalVisible}
      onRequestClose={() => setProductDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {selectedProduct && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Product Details</Text>
                <TouchableOpacity onPress={() => setProductDetailModalVisible(false)}>
                  <AntDesign name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContentContainer}
              >
                {/* Product Image */}
                {selectedProduct.firebaseImageUrl ? (
                  <Image 
                    source={{ uri: selectedProduct.firebaseImageUrl }} 
                    style={styles.detailImage}
                  />
                ) : selectedProduct.localImageUri ? (
                  <Image 
                    source={{ uri: selectedProduct.localImageUri }} 
                    style={styles.detailImage}
                  />
                ) : selectedProduct.imageUri ? (
                  <Image 
                    source={typeof selectedProduct.imageUri === 'string' 
                      ? { uri: selectedProduct.imageUri } 
                      : selectedProduct.imageUri
                    } 
                    style={styles.detailImage}
                  />
                ) : (
                  <Image 
                    source={getRandomProductImage(selectedProduct.category || 'Seeds')}
                    style={styles.detailImage}
                  />
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>{selectedProduct.title}</Text>
                  <Text style={styles.detailPrice}>{selectedProduct.price || '₹0'}</Text>
                </View>
                
                {selectedProduct.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailText}>{selectedProduct.description}</Text>
                  </View>
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.detailChip}>
                    <Text style={styles.detailChipText}>{selectedProduct.category}</Text>
                  </View>
                </View>
                
                {selectedProduct.quantity && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailText}>
                      {selectedProduct.quantity} {selectedProduct.unit}
                    </Text>
                  </View>
                )}
                
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Specifications</Text>
                    <View style={styles.specificationsContainer}>
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <View key={key} style={styles.specRow}>
                          <Text style={styles.specKey}>{key}:</Text>
                          <Text style={styles.specValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    selectedProduct.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedProduct.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {selectedProduct.rating && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Rating</Text>
                    <View style={styles.ratingContainer}>
                      <FontAwesome name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{selectedProduct.rating}</Text>
                      <Text style={styles.reviewsText}>({selectedProduct.reviews || 0} reviews)</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Added On</Text>
                  <Text style={styles.detailText}>
                    {selectedProduct.createdDate 
                      ? new Date(selectedProduct.createdDate).toLocaleDateString()
                      : selectedProduct.createdAt
                      ? new Date(selectedProduct.createdAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </Text>
                </View>
                
                {selectedProduct.firebaseImageSaved && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Storage</Text>
                    <View style={styles.cloudStatus}>
                      <MaterialIcons name="cloud-done" size={16} color="#4CAF50" />
                      <Text style={styles.cloudStatusText}>Stored in Cloud</Text>
                    </View>
                    {selectedProduct.storagePath && (
                      <Text style={styles.storagePath}>
                        Path: {selectedProduct.storagePath}
                      </Text>
                    )}
                  </View>
                )}
                
                <View style={styles.userInfoSection}>
                  <Text style={styles.sectionTitle}>Seller Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>User Type:</Text>
                    <Text style={styles.infoValue}>{selectedProduct.userType || userType}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>State:</Text>
                    <Text style={styles.infoValue}>{selectedProduct.state || state}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>District:</Text>
                    <Text style={styles.infoValue}>{selectedProduct.district || district}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{selectedProduct.phoneNumber || phoneNumber}</Text>
                  </View>
                  {selectedProduct.sellerName && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Seller Name:</Text>
                      <Text style={styles.infoValue}>{selectedProduct.sellerName}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.button, styles.fullWidthButton, styles.deleteButton]}
                  onPress={() => {
                    handleDeleteProduct(selectedProduct.id);
                    setProductDetailModalVisible(false);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete Product</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render highlights
  const renderHighlights = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.highlightsContainer}
      >
        {userData.highlights?.map((highlight) => (
          <TouchableOpacity 
            key={highlight.id} 
            style={styles.highlightItem}
            onPress={() => {
              // Update highlights to set only the clicked one as active
              const updatedHighlights = userData.highlights.map(h => ({
                ...h,
                isActive: h.id === highlight.id
              }));
              
              setUserData(prev => ({
                ...prev,
                highlights: updatedHighlights
              }));
              
              // Update the category in new product if it matches
              const categoryMap = {
                'Seeds': 'Seeds',
                'Tools': 'Tools',
                'Fertilizer': 'Fertilizer',
                'Equipment': 'Equipment'
              };
              
              const category = categoryMap[highlight.title];
              if (category) {
                handleCategoryChange(category);
              }
            }}
          >
            <View style={[
              styles.highlightCircle,
              highlight.isActive && styles.activeHighlightCircle
            ]}>
              <MaterialCommunityIcons 
                name={highlight.icon} 
                size={width * 0.06} 
                color={highlight.isActive ? '#4CAF50' : '#666'} 
              />
              {highlight.isActive && (
                <View style={styles.activeBadge}>
                  <AntDesign name="check" size={10} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[
              styles.highlightText,
              highlight.isActive && styles.activeHighlightText
            ]}>
              {highlight.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading && !userData.name) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
        <Text style={styles.loadingSubtext}>
          {userType} | {state} | {district}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        <View style={styles.profileContainer}>
          {/* Profile Info Section */}
          <View style={styles.profileInfo}>
            {/* Profile Image */}
            <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
              ) : (
                <Image source={profileImage} style={styles.profileImage} />
              )}
              
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.uploadText}>
                    {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Uploading...'}
                  </Text>
                </View>
              )}
              
              <View style={styles.addButton}>
                <Ionicons name="add" size={width * 0.05} color="white" />
              </View>
              
              {userData.profileImageStorageUrl && (
                <View style={styles.cloudProfileBadge}>
                  <MaterialIcons name="cloud-done" size={10} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{products.length}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userData.stats?.followers || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userData.stats?.following || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.name}>{userData.name}</Text>
            <Text style={styles.bio}>{userData.bio}</Text>
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={width * 0.035} color="#666" />
              <Text style={styles.locationText}>{userData.location}</Text>
            </View>
            {userData.website ? (
              <TouchableOpacity onPress={() => Linking.openURL(userData.website).catch(() => {})}>
                <Text style={styles.website}>{userData.website}</Text>
              </TouchableOpacity>
            ) : null}
            
            {/* User Info Badges */}
            <View style={styles.userInfoBadges}>
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeText}>
                  {userType === 'framer' ? '👨‍🌾 Farmer' : '🤖 Autonomous'}
                </Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>
                  📍 {state}, {district}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <Text style={styles.editButtonText}>Edit Profile</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareProfile}
            >
              <Feather name="share-2" size={width * 0.045} color="#3897f0" />
            </TouchableOpacity>
            
          </View>

          {/* Highlights */}
          {renderHighlights()}
        </View>

        {/* Add Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addProductButton} 
            onPress={handleAddProduct}
            activeOpacity={0.7}
            disabled={uploading}
          >
            <MaterialIcons name="add-box" size={width * 0.07} color="white" />
            <Text style={styles.addButtonText}>
              {uploading ? 'Adding...' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Products ({products.length})</Text>
        </View>

        {/* Products Grid */}
        {products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-bag" size={60} color="#ddd" />
            <Text style={styles.emptyStateText}>No products yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first product to get started
            </Text>
          </View>
        )}
        
        {/* Spacer at bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      {renderEditModal()}
      {renderAddProductModal()}
      {renderProductDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  profileContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: 15,
    paddingBottom: 15,
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImageContainer: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  profileImage: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: width * 0.14,
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: width * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: width * 0.01,
    right: width * 0.01,
    backgroundColor: '#4CAF50',
    width: width * 0.07,
    height: width * 0.07,
    borderRadius: width * 0.035,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cloudProfileBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    marginLeft: width * 0.05,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: width * 0.02,
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: width * 0.045,
    color: '#333',
  },
  statLabel: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 4,
  },
  bioContainer: {
    marginBottom: 15,
  },
  name: {
    fontWeight: 'bold',
    fontSize: width * 0.055,
    marginBottom: 5,
    color: '#333',
  },
  bio: {
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: 8,
    lineHeight: width * 0.05,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: width * 0.035,
    color: '#666',
    marginLeft: width * 0.01,
  },
  website: {
    color: '#3897f0',
    fontSize: width * 0.035,
    fontWeight: '500',
    marginBottom: 8,
  },
  userInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  userTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  locationBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: width * 0.038,
    color: '#333',
  },
  shareButton: {
    width: width * 0.12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightsContainer: {
    paddingBottom: 10,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: width * 0.05,
  },
  highlightCircle: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#f9f9f9',
  },
  activeHighlightCircle: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  highlightText: {
    fontSize: width * 0.032,
    color: '#333',
  },
  activeHighlightText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  activeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addButtonContainer: {
    paddingHorizontal: width * 0.05,
    marginBottom: 15,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    marginLeft: width * 0.02,
    fontSize: width * 0.038,
    fontWeight: '600',
    color: 'white',
  },
  sectionHeader: {
    paddingHorizontal: width * 0.05,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  gridContainer: {
    paddingHorizontal: width * 0.02,
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: width * 0.02,
    backgroundColor: '#f9f9f9',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  productInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: width * 0.02,
  },
  productTitle: {
    color: 'white',
    fontSize: width * 0.03,
    fontWeight: '600',
  },
  productPrice: {
    color: 'white',
    fontSize: width * 0.028,
    marginTop: height * 0.002,
  },
  productCategoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productCategoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cloudBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: width * 0.05,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalContentContainer: {
    paddingVertical: 16,
    paddingBottom: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  // Image Picker Styles
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  imagePreview: {
    width: 180,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  uploadProgressContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgressText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  imagePickerContainer: {
    marginBottom: 15,
  },
  imagePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedCategory: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  imageInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  categoryBadgeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  imagePickerList: {
    paddingVertical: 6,
  },
  imageOption: {
    marginRight: 10,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
  },
  imageOptionContainer: {
    position: 'relative',
  },
  imageOptionSelected: {
    borderColor: '#4CAF50',
  },
  imageOptionThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 6,
  },
  categoryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNameText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    width: 70,
    lineHeight: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  unitPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitText: {
    fontSize: 12,
    color: '#666',
  },
  unitTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fullWidthButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Detail Modal Styles
  detailImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  detailChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  detailChipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  specificationsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  specKey: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cloudStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cloudStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  storagePath: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  userInfoSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});

export default ProfileScreen;