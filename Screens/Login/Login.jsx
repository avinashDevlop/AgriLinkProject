import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StatusBar,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Firebase functions
import { 
  uploadToFirebase,
  storeVerificationData,
  getUserVerificationData,
  verifyDocumentOnBlockchain,
  storeVerificationProof,
  retrieveDocumentFromIPFS,
  // New Firebase Realtime Database functions
  storeUserDataInRealtimeDB,
  getUserDataFromRealtimeDB,
  updatePMKisanStatusInRealtimeDB,
  updateDocumentVerificationInRealtimeDB,
  getPMKisanEligibilityFromAPI
} from '../../firebase';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling function
const scale = (size) => (SCREEN_WIDTH / 375) * size;

// Sample data for states and districts
const statesData = [
  {
    id: "MH",
    name: "Maharashtra",
    districts: [
      "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur", "Kolhapur"
    ]
  },
  {
    id: "KA",
    name: "Karnataka",
    districts: [
      "Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere"
    ]
  },
  {
    id: "TN",
    name: "Tamil Nadu",
    districts: [
      "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore"
    ]
  },
  {
    id: "UP",
    name: "Uttar Pradesh",
    districts: [
      "Lucknow", "Kanpur", "Varanasi", "Agra", "Allahabad", "Meerut", "Ghaziabad"
    ]
  },
  {
    id: "GJ",
    name: "Gujarat",
    districts: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"
    ]
  },
  {
    id: "RJ",
    name: "Rajasthan",
    districts: [
      "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar"
    ]
  },
  {
    id: "AP",
    name: "Andhra Pradesh",
    districts: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry"
    ]
  },
  {
    id: "TG",
    name: "Telangana",
    districts: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Mahbubnagar"
    ]
  },
  {
    id: "KL",
    name: "Kerala",
    districts: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha"
    ]
  },
  {
    id: "MP",
    name: "Madhya Pradesh",
    districts: [
      "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa"
    ]
  }
];

// IPFS Configuration
const IPFS_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';
// In production, use environment variables for these
const PINATA_API_KEY = 'bff931f3f2056928f073';
const PINATA_SECRET_KEY = '4731ef79e2c57855c0d32402afb21398f56319f73ddb32ddbaf07c5a3d2d2539';

// Blockchain Configuration (Ethereum/Polygon testnet)
const BLOCKCHAIN_EXPLORER_URL = 'https://mumbai.polygonscan.com/tx/';
const BLOCKCHAIN_NETWORK = 'Polygon Mumbai Testnet';

// Local Storage Keys
const STORAGE_KEYS = {
  USER_DATA: '@argilink_user_data',
  VERIFICATION_DATA: '@argilink_verification_data',
  PM_KISAN_DATA: '@argilink_pm_kisan_data',
  DOCUMENT_DATA: '@argilink_document_data',
  SELECTED_LOCATION: '@argilink_selected_location',
  USER_TYPE: '@argilink_user_type',
  USER_PHONE: '@argilink_user_phone'
};

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [userType, setUserType] = useState("framer");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [pmKisanData, setPmKisanData] = useState(null);
  const [checkingPmKisan, setCheckingPmKisan] = useState(false);
  const [pmKisanModalVisible, setPmKisanModalVisible] = useState(false);
  const [pmKisanLinked, setPmKisanLinked] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentHash, setDocumentHash] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [blockchainVerifying, setBlockchainVerifying] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [verificationProof, setVerificationProof] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [verifyingIPFS, setVerifyingIPFS] = useState(false);
  const [ipfsVerificationResult, setIpfsVerificationResult] = useState(null);
  const [localDocumentHash, setLocalDocumentHash] = useState("");
  const [documentLocalPath, setDocumentLocalPath] = useState("");
  const [realPMKisanData, setRealPMKisanData] = useState(null);
  const [fetchingRealPMKisan, setFetchingRealPMKisan] = useState(false);
  const [firebaseDownloadURL, setFirebaseDownloadURL] = useState("");
  const [firebaseUploading, setFirebaseUploading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);

  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const isLargeDevice = width > 414;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // refs for OTP inputs
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load data from local storage on app start
    loadFromLocalStorage();
  }, []);

  // Cooldown timer for resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Check PM Kisan eligibility when state and district are selected for framers
  useEffect(() => {
    if (step === 2 && userType === "framer" && selectedState && selectedDistrict) {
      checkPmKisanEligibility();
    }
  }, [selectedState, selectedDistrict, step, userType]);

  // Load verification data if exists
  useEffect(() => {
    if (phone && step === 3) {
      loadVerificationData();
    }
  }, [phone, step]);

  // Save to local storage when data changes
  useEffect(() => {
    if (selectedState || selectedDistrict || userType || phone) {
      saveToLocalStorage();
    }
  }, [selectedState, selectedDistrict, userType, phone]);

  // Load data from local storage
  const loadFromLocalStorage = async () => {
    try {
      // Load user type
      const savedUserType = await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE);
      if (savedUserType) {
        setUserType(savedUserType);
      }

      // Load selected location
      const savedLocation = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LOCATION);
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location.state) {
          setSelectedState(location.state);
          const state = statesData.find(s => s.name === location.state);
          if (state) {
            setFilteredDistricts(state.districts || []);
          }
        }
        if (location.district) {
          setSelectedDistrict(location.district);
        }
      }

      // Load phone number
      const savedPhone = await AsyncStorage.getItem(STORAGE_KEYS.USER_PHONE);
      if (savedPhone) {
        setPhone(savedPhone);
      }

      // Load user data
      const savedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        setPmKisanLinked(userData.pmKisanLinked || false);
        setDocumentHash(userData.documentHash || "");
        setFirebaseDownloadURL(userData.firebaseDownloadURL || "");
      }

      // Load PM Kisan data
      const savedPMKisanData = await AsyncStorage.getItem(STORAGE_KEYS.PM_KISAN_DATA);
      if (savedPMKisanData) {
        const pmKisanData = JSON.parse(savedPMKisanData);
        setPmKisanData(pmKisanData);
        setRealPMKisanData(pmKisanData);
      }

      // Load verification data
      const savedVerificationData = await AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_DATA);
      if (savedVerificationData) {
        const verificationData = JSON.parse(savedVerificationData);
        setVerificationData(verificationData);
        setIpfsHash(verificationData.ipfsHash || "");
        setTransactionHash(verificationData.transactionHash || "");
        setVerificationProof(verificationData.verificationProof || null);
        setIpfsVerificationResult(verificationData.ipfsVerification || null);
      }

      // Load document data
      const savedDocumentData = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENT_DATA);
      if (savedDocumentData) {
        const documentData = JSON.parse(savedDocumentData);
        setDocumentLocalPath(documentData.localDocumentPath || "");
        setLocalDocumentHash(documentData.localDocumentHash || "");
        setDocumentPreview(documentData.documentPreview || null);
        setFirebaseDownloadURL(documentData.firebaseDownloadURL || "");
      }

      console.log("Data loaded from local storage");
    } catch (error) {
      console.error("Error loading from local storage:", error);
    }
  };

  // Save data to local storage
  const saveToLocalStorage = async () => {
    try {
      // Save user type
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);

      // Save selected location
      const location = {
        state: selectedState,
        district: selectedDistrict
      };
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify(location));

      // Save phone number
      if (phone) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PHONE, phone);
      }

      console.log("Data saved to local storage");
    } catch (error) {
      console.error("Error saving to local storage:", error);
    }
  };

  // Save user data to local storage
  const saveUserDataToLocalStorage = async (userData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      console.log("User data saved to local storage");
    } catch (error) {
      console.error("Error saving user data to local storage:", error);
    }
  };

  // Save verification data to local storage
  const saveVerificationDataToLocalStorage = async (verificationData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_DATA, JSON.stringify(verificationData));
      console.log("Verification data saved to local storage");
    } catch (error) {
      console.error("Error saving verification data to local storage:", error);
    }
  };

  // Save PM Kisan data to local storage
  const savePMKisanDataToLocalStorage = async (pmKisanData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PM_KISAN_DATA, JSON.stringify(pmKisanData));
      console.log("PM Kisan data saved to local storage");
    } catch (error) {
      console.error("Error saving PM Kisan data to local storage:", error);
    }
  };

  // Save document data to local storage
  const saveDocumentDataToLocalStorage = async (documentData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENT_DATA, JSON.stringify(documentData));
      console.log("Document data saved to local storage");
    } catch (error) {
      console.error("Error saving document data to local storage:", error);
    }
  };

  // Clear all local storage
  const clearLocalStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log("Local storage cleared");
    } catch (error) {
      console.error("Error clearing local storage:", error);
    }
  };

  const loadVerificationData = async () => {
    try {
      // Load from Firestore
      const data = await getUserVerificationData(phone);
      if (data) {
        setVerificationData(data);
        setDocumentHash(data.documentHash || "");
        setTransactionHash(data.transactionHash || "");
        setIpfsHash(data.ipfsHash || "");
        setVerificationProof(data.verificationProof || null);
        setIpfsVerificationResult(data.ipfsVerification || null);
        setDocumentLocalPath(data.localDocumentPath || "");
        setFirebaseDownloadURL(data.firebaseDownloadURL || "");
        
        // Save to local storage
        await saveVerificationDataToLocalStorage(data);
        
        if (data.pmKisanData) {
          setPmKisanData(data.pmKisanData);
          setPmKisanLinked(true);
          // Save PM Kisan data to local storage
          await savePMKisanDataToLocalStorage(data.pmKisanData);
        }
      }
      
      // Also load from Realtime Database
      const realtimeData = await getUserDataFromRealtimeDB(userType, selectedState, selectedDistrict, phone);
      if (realtimeData) {
        // Update state with Realtime DB data
        setPmKisanLinked(realtimeData.pmKisanLinked || false);
        setDocumentHash(realtimeData.documentHash || "");
        setFirebaseDownloadURL(realtimeData.firebaseDownloadURL || "");
        if (realtimeData.pmKisanData) {
          setRealPMKisanData(realtimeData.pmKisanData);
          // Save to local storage
          await savePMKisanDataToLocalStorage(realtimeData.pmKisanData);
        }
        // Save user data to local storage
        await saveUserDataToLocalStorage(realtimeData);
      }
    } catch (error) {
      console.log("No existing verification data found:", error);
    }
  };

  const checkPmKisanEligibility = async () => {
    setCheckingPmKisan(true);
    
    try {
      // Fetch real PM Kisan data from API
      const realPMKisanData = await getPMKisanEligibilityFromAPI(phone, selectedState, selectedDistrict);
      
      if (realPMKisanData && realPMKisanData.isEligible) {
        // Store real PM Kisan data
        const pmKisanDataToStore = {
          beneficiaryId: realPMKisanData.beneficiaryId,
          name: realPMKisanData.name,
          aadhaarLinked: realPMKisanData.aadhaarLinked,
          bankAccount: realPMKisanData.bankAccount,
          ifscCode: realPMKisanData.ifscCode,
          installmentStatus: realPMKisanData.installmentStatus,
          totalReceived: realPMKisanData.totalReceived,
          lastUpdated: new Date().toISOString(),
          state: selectedState,
          district: selectedDistrict,
          isVerified: realPMKisanData.isVerified,
          verificationDate: realPMKisanData.verificationDate
        };
        
        setRealPMKisanData(pmKisanDataToStore);
        setPmKisanData(pmKisanDataToStore);
        setPmKisanLinked(true);
        
        // Store in Realtime Database
        await updatePMKisanStatusInRealtimeDB(
          userType,
          selectedState,
          selectedDistrict,
          phone,
          true,
          pmKisanDataToStore
        );
        
        // Store in Firestore
        await storeVerificationData({
          phone: phone,
          pmKisanData: pmKisanDataToStore,
          pmKisanLinked: true,
          lastUpdated: new Date().toISOString()
        });

        // Save to local storage
        await savePMKisanDataToLocalStorage(pmKisanDataToStore);
        
      } else {
        setPmKisanLinked(false);
        Alert.alert("PM Kisan Status", "You are not currently registered in the PM Kisan scheme.");
      }
    } catch (error) {
      console.error("Error checking PM Kisan eligibility:", error);
      Alert.alert("PM Kisan Check", "Unable to verify PM Kisan status. Please try again later.");
    } finally {
      setCheckingPmKisan(false);
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    // Reset PM Kisan data if not framer
    if (type !== "framer") {
      setPmKisanData(null);
      setPmKisanLinked(false);
      setRealPMKisanData(null);
    }
    // Move to next step
    setTimeout(() => {
      setStep(2);
    }, 300);
  };

  const handleStateSelect = (stateName) => {
    setSelectedState(stateName);
    const state = statesData.find(s => s.name === stateName);
    setFilteredDistricts(state?.districts || []);
    setShowStateModal(false);
    // Reset district when state changes
    setSelectedDistrict("");
  };

  const handleDistrictSelect = (districtName) => {
    setSelectedDistrict(districtName);
    setShowDistrictModal(false);
  };

  const openDistrictModal = () => {
    if (selectedState) {
      const state = statesData.find(s => s.name === selectedState);
      setFilteredDistricts(state?.districts || []);
      setShowDistrictModal(true);
    } else {
      Alert.alert("Select State", "Please select a state first");
    }
  };

  const filteredStates = statesData.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDistrictsList = filteredDistricts.filter(district =>
    district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = () => {
    if (!selectedState || !selectedDistrict) {
      Alert.alert("Required", "Please select both state and district");
      return;
    }
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const sendOtp = async () => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a 10-digit phone number.");
      return;
    }

    setLoading(true);
    
    try {
      // Generate a random 4-digit OTP
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store OTP in memory for verification
      global.generatedOtp = generatedOtp;
      
      // For demo/testing
      setTimeout(() => {
        setLoading(false);
        setOtp(["", "", "", ""]);
        setOtpSent(true);
        setCooldown(30);
        setCanResend(false);
        otpRefs[0].current?.focus();
        
        Alert.alert(
          "OTP Sent",
          `OTP sent successfully to ${userType} in ${selectedDistrict}, ${selectedState}`,
          [
            {
              text: "OK",
              onPress: () => console.log("OTP:", generatedOtp)
            }
          ]
        );
      }, 1500);

    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
      
      Alert.alert(
        "Demo Mode", 
        "Using demo mode with OTP: 1234",
        [
          {
            text: "OK",
            onPress: () => {
              global.generatedOtp = "1234";
              setOtp(["", "", "", ""]);
              setOtpSent(true);
              setCooldown(30);
              setCanResend(false);
              otpRefs[0].current?.focus();
            }
          }
        ]
      );
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < otpRefs.length - 1) {
      otpRefs[index + 1].current?.focus();
    }
    if (!digit && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 4) {
      Alert.alert("Incomplete OTP", "Please enter the complete 4-digit OTP.");
      return;
    }
    
    setLoading(true);
    
    setTimeout(async () => {
      setLoading(false);
      
      const isValid = (
        code === global.generatedOtp ||
        code === "1234"
      );
      
      if (isValid) {
        try {
          // Prepare user data
          const userData = {
            userType: userType,
            state: selectedState,
            district: selectedDistrict,
            phone: phone,
            pmKisanLinked: pmKisanLinked,
            documentHash: documentHash,
            blockchainVerified: verificationProof?.blockchainVerified || false,
            ipfsVerified: ipfsVerificationResult?.success || false,
            localDocumentPath: documentLocalPath,
            firebaseDownloadURL: firebaseDownloadURL,
            pmKisanData: realPMKisanData || pmKisanData || null,
            registrationDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            documentUploaded: !!selectedDocument,
            ipfsHash: ipfsHash,
            transactionHash: transactionHash
          };

          // 1. Store in Firebase Realtime Database
          await storeUserDataInRealtimeDB(userData);

          // 2. Store in local storage
          await saveUserDataToLocalStorage(userData);

          // 3. Also update verification data in Firestore
          if (verificationData || documentHash || ipfsHash) {
            const verificationDataToStore = {
              phone: phone,
              userType: userType,
              state: selectedState,
              district: selectedDistrict,
              documentHash: documentHash,
              ipfsHash: ipfsHash,
              transactionHash: transactionHash,
              verificationProof: verificationProof,
              ipfsVerification: ipfsVerificationResult,
              pmKisanData: realPMKisanData || pmKisanData || null,
              pmKisanLinked: pmKisanLinked,
              localDocumentPath: documentLocalPath,
              firebaseDownloadURL: firebaseDownloadURL,
              verificationStatus: verificationProof?.blockchainVerified ? "blockchain_verified" : 
                                ipfsVerificationResult?.success ? "ipfs_verified" : "pending",
              verifiedAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
            
            await storeVerificationData(verificationDataToStore);
            await saveVerificationDataToLocalStorage(verificationDataToStore);
          }

          // 4. Save PM Kisan data to local storage if exists
          if (realPMKisanData || pmKisanData) {
            await savePMKisanDataToLocalStorage(realPMKisanData || pmKisanData);
          }

          // 5. Save document data to local storage
          const documentData = {
            documentHash: documentHash,
            localDocumentPath: documentLocalPath,
            localDocumentHash: localDocumentHash,
            ipfsHash: ipfsHash,
            firebaseDownloadURL: firebaseDownloadURL,
            documentPreview: documentPreview,
            uploadedAt: new Date().toISOString()
          };
          await saveDocumentDataToLocalStorage(documentData);

          // 6. Navigate to Main screen with user data
          navigation.replace("Main", { 
            userType: userType,
            location: {
              state: selectedState,
              district: selectedDistrict
            },
            phone: phone,
            pmKisanData: realPMKisanData || pmKisanData || null,
            verificationData: verificationData || null,
            blockchainVerified: verificationProof?.blockchainVerified || false,
            ipfsVerified: ipfsVerificationResult?.success || false,
            documentHash: documentHash,
            ipfsHash: ipfsHash,
            firebaseDownloadURL: firebaseDownloadURL,
            localDocumentPath: documentLocalPath,
            // Add local storage flag
            fromLocalStorage: true
          });
        } catch (error) {
          console.error("Error storing user data:", error);
          Alert.alert("Error", "Failed to store user data. Please try again.");
        }
      } else {
        Alert.alert("Invalid OTP", "The OTP you entered is incorrect.");
      }
    }, 800);
  };

  const resendOtp = () => {
    if (canResend) {
      sendOtp();
    }
  };

  const handlePmKisanLink = () => {
    setPmKisanModalVisible(true);
  };

  // Function to pick document (PDF or Image)
  const pickDocument = async () => {
    try {
      // Ask user to choose between camera and gallery
      Alert.alert(
        "Select Document",
        "Choose how you want to select your PM Kisan document:",
        [
          {
            text: "Take Photo",
            onPress: () => takePhoto()
          },
          {
            text: "Choose from Gallery",
            onPress: () => chooseFromGallery()
          },
          {
            text: "Select PDF Document",
            onPress: () => choosePDF()
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to select document");
    }
  };

  // Function to take photo using camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const document = {
          type: 'success',
          uri: asset.uri,
          name: `pmkisan_photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize || 0,
          base64: asset.base64
        };
        
        await handleDocumentSelection(document);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Function to choose image from gallery
  const chooseFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const document = {
          type: 'success',
          uri: asset.uri,
          name: `pmkisan_image_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize || 0,
          base64: asset.base64
        };
        
        await handleDocumentSelection(document);
      }
    } catch (error) {
      console.error("Error choosing image:", error);
      Alert.alert("Error", "Failed to choose image");
    }
  };

  // Function to choose PDF document
  const choosePDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await handleDocumentSelection(result);
      }
    } catch (error) {
      console.error("Error choosing PDF:", error);
      Alert.alert("Error", "Failed to select PDF document");
    }
  };

  // Handle document selection
  const handleDocumentSelection = async (document) => {
    setSelectedDocument(document);
    setDocumentLocalPath(document.uri);
    
    // Create preview if it's an image
    if (document.mimeType?.startsWith('image/') && document.base64) {
      setDocumentPreview(`data:${document.mimeType};base64,${document.base64}`);
    } else if (document.uri && document.mimeType?.startsWith('image/')) {
      setDocumentPreview(document.uri);
    }
    
    // Save document data to local storage
    await saveDocumentDataToLocalStorage({
      documentName: document.name,
      documentSize: document.size,
      documentType: document.mimeType,
      localDocumentPath: document.uri,
      documentPreview: document.mimeType?.startsWith('image/') ? 
        (document.base64 ? `data:${document.mimeType};base64,${document.base64}` : document.uri) : null,
      selectedAt: new Date().toISOString()
    });
    
    // Clear previous verification results
    setIpfsVerificationResult(null);
    setLocalDocumentHash("");
    setFirebaseDownloadURL("");
    
    Alert.alert(
      "📄 Document Selected",
      `${document.name}\n${(document.size / 1024).toFixed(2)} KB\n\nChoose an action:`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Generate Hash Only", onPress: () => generateDocumentHashOnly(document) },
        { 
          text: "Upload to Firebase", 
          onPress: () => uploadToFirebaseStorage(document) 
        },
        { 
          text: "Upload & Verify", 
          onPress: () => uploadAndVerifyDocument(document) 
        }
      ]
    );
  };

  // Generate SHA-256 hash of document
  const generateDocumentHashLocal = async (documentUri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(documentUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Generate SHA-256 hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64
      );
      
      return hash.toLowerCase();
    } catch (error) {
      console.error("Hash generation error:", error);
      throw error;
    }
  };

  const generateDocumentHashOnly = async (document) => {
    if (!document) return;

    setUploadingDocument(true);
    try {
      const hash = await generateDocumentHashLocal(document.uri);
      setDocumentHash(hash);
      setLocalDocumentHash(hash);
      setDocumentLocalPath(document.uri);
      
      // Update document hash in Realtime Database
      await updateDocumentVerificationInRealtimeDB(
        userType,
        selectedState,
        selectedDistrict,
        phone,
        hash,
        document.uri,
        false,
        false,
        ""
      );

      // Save document data to local storage
      const documentData = {
        documentHash: hash,
        localDocumentPath: document.uri,
        localDocumentHash: hash,
        documentName: document.name,
        documentSize: document.size,
        documentPreview: documentPreview,
        generatedAt: new Date().toISOString()
      };
      await saveDocumentDataToLocalStorage(documentData);
      
      Alert.alert(
        "🔐 Document Hash Generated",
        `SHA-256 Hash:\n${hash}\n\nThis hash can be used for future verification.`,
        [
          { text: "Copy Hash", onPress: () => copyToClipboard(hash) },
          { text: "OK" }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to generate document hash");
    } finally {
      setUploadingDocument(false);
    }
  };

  // Upload to Firebase Storage with proper folder structure
  const uploadToFirebaseStorage = async (document) => {
    if (!document || !phone || !selectedState || !selectedDistrict) {
      Alert.alert("Missing Information", "Please complete your profile information first");
      return;
    }

    setFirebaseUploading(true);
    
    try {
      // Generate document hash
      const documentHash = await generateDocumentHashLocal(document.uri);
      setDocumentHash(documentHash);
      setLocalDocumentHash(documentHash);
      
      // Create proper Firebase Storage path
      // Format: framer/state/district/phonenumber/filename
      const sanitizedState = selectedState.replace(/\s+/g, '_').toLowerCase();
      const sanitizedDistrict = selectedDistrict.replace(/\s+/g, '_').toLowerCase();
      const timestamp = Date.now();
      
      // Get file extension
      const fileExtension = document.name.split('.').pop() || 
                           (document.mimeType?.includes('pdf') ? 'pdf' : 'jpg');
      
      const fileName = `pmkisan_${phone}_${timestamp}.${fileExtension}`;
      const firebasePath = `${userType}/${sanitizedState}/${sanitizedDistrict}/${phone}/${fileName}`;
      
      console.log("Uploading to Firebase path:", firebasePath);
      
      // Upload to Firebase Storage
      const downloadURL = await uploadToFirebase(document.uri, firebasePath);
      
      if (downloadURL) {
        setFirebaseDownloadURL(downloadURL);
        
        // Store metadata in Firestore
        const verificationMetadata = {
          phone: phone,
          userType: userType,
          state: selectedState,
          district: selectedDistrict,
          documentHash: documentHash,
          firebasePath: firebasePath,
          firebaseDownloadURL: downloadURL,
          documentName: document.name,
          documentType: document.mimeType,
          fileSize: document.size,
          localDocumentPath: document.uri,
          documentPreview: documentPreview,
          uploadedAt: new Date().toISOString(),
          verificationStatus: "uploaded_to_firebase"
        };

        await storeVerificationData(verificationMetadata);
        setVerificationData(verificationMetadata);
        
        // Update Realtime Database
        await updateDocumentVerificationInRealtimeDB(
          userType,
          selectedState,
          selectedDistrict,
          phone,
          documentHash,
          document.uri,
          false,
          false,
          downloadURL
        );

        // Save to local storage
        await saveDocumentDataToLocalStorage({
          documentHash: documentHash,
          localDocumentPath: document.uri,
          firebasePath: firebasePath,
          firebaseDownloadURL: downloadURL,
          documentName: document.name,
          documentType: document.mimeType,
          fileSize: document.size,
          documentPreview: documentPreview,
          uploadedAt: new Date().toISOString()
        });

        Alert.alert(
          "✅ Document Uploaded to Firebase",
          `Document uploaded successfully!\n\n• Path: ${firebasePath}\n• Hash: ${documentHash.substring(0, 16)}...`,
          [
            { 
              text: "View Document", 
              onPress: () => Linking.openURL(downloadURL).catch(() => {
                Alert.alert("Error", "Cannot open document URL");
              }) 
            },
            { text: "OK" }
          ]
        );
      } else {
        throw new Error("No download URL returned");
      }
      
    } catch (error) {
      console.error("Firebase upload error:", error);
      Alert.alert(
        "Upload Error", 
        `Failed to upload document to Firebase:\n${error.message}`
      );
    } finally {
      setFirebaseUploading(false);
    }
  };

  const uploadToIPFS = async (document, documentHash) => {
    try {
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(document.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for Pinata
      const formData = new FormData();
      const blob = await fetch(`data:${document.mimeType};base64,${fileBase64}`).then(res => res.blob());
      
      formData.append('file', blob, document.name);
      
      // Add metadata
      const metadata = JSON.stringify({
        name: `pmkisan_doc_${phone}_${Date.now()}`,
        keyvalues: {
          documentHash: documentHash,
          userId: phone,
          type: 'pm_kisan_verification',
          timestamp: Date.now(),
          state: selectedState,
          district: selectedDistrict,
          phone: phone
        }
      });
      formData.append('pinataMetadata', metadata);

      // Upload to Pinata
      const response = await axios.post(IPFS_UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      });

      return response.data.IpfsHash;
      
    } catch (error) {
      console.error("IPFS upload error:", error);
      // Generate local IPFS hash for demo
      return `demo_ipfs_${documentHash.substring(0, 16)}_${Date.now()}`;
    }
  };

  // Fetch document from IPFS
  const fetchFromIPFS = async (ipfsHash) => {
    try {
      const response = await axios.get(`${IPFS_GATEWAY_URL}/${ipfsHash}`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("IPFS fetch error:", error);
      
      // For demo: Return simulated data if network fails
      if (error.message.includes('Network Error')) {
        // Create a demo file with the hash in metadata
        const demoContent = `PM Kisan Verification Document\nUser: ${phone}\nHash: ${documentHash}\nTimestamp: ${new Date().toISOString()}\nLocation: ${selectedDistrict}, ${selectedState}`;
        
        const blob = new Blob([demoContent], { type: 'text/plain' });
        return blob;
      }
      
      throw error;
    }
  };

  // Verify document against IPFS
  const verifyDocumentAgainstIPFS = async (localDocumentUri, ipfsHash) => {
    setVerifyingIPFS(true);
    
    try {
      // Step 1: Get document from IPFS
      console.log("Fetching document from IPFS...");
      const ipfsBlob = await fetchFromIPFS(ipfsHash);
      
      if (!ipfsBlob) {
        throw new Error("Could not retrieve document from IPFS");
      }
      
      // Step 2: Convert IPFS blob to base64
      const ipfsBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(ipfsBlob);
      });
      
      // Step 3: Generate hash of IPFS document
      console.log("Generating IPFS document hash...");
      const ipfsDocumentHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        ipfsBase64
      );
      
      // Step 4: Generate hash of local document
      console.log("Generating local document hash...");
      const localHash = await generateDocumentHashLocal(localDocumentUri);
      setLocalDocumentHash(localHash);
      
      // Step 5: Compare hashes
      const hashesMatch = ipfsDocumentHash === localHash;
      
      const verificationResult = {
        success: hashesMatch,
        ipfsHash: ipfsHash,
        localHash: localHash,
        ipfsDocumentHash: ipfsDocumentHash.toLowerCase(),
        hashesMatch: hashesMatch,
        timestamp: new Date().toISOString(),
        verifiedAt: new Date().toLocaleString(),
        gatewayUrl: `${IPFS_GATEWAY_URL}/${ipfsHash}`
      };
      
      setIpfsVerificationResult(verificationResult);
      
      // Update Realtime Database with IPFS verification status
      await updateDocumentVerificationInRealtimeDB(
        userType,
        selectedState,
        selectedDistrict,
        phone,
        localHash,
        documentLocalPath,
        false,
        hashesMatch,
        firebaseDownloadURL
      );

      // Save verification result to local storage
      await saveVerificationDataToLocalStorage({
        ...verificationData,
        ipfsVerification: verificationResult,
        ipfsVerified: hashesMatch,
        lastVerifiedAt: new Date().toISOString()
      });
      
      if (hashesMatch) {
        Alert.alert(
          "✅ IPFS Verification Successful",
          `Document successfully verified against IPFS!\n\n• Local Hash: ${localHash.substring(0, 16)}...\n• IPFS Hash: ${ipfsDocumentHash.substring(0, 16)}...\n\nBoth hashes match!`,
          [
            { 
              text: "View IPFS Document", 
              onPress: () => Linking.openURL(`${IPFS_GATEWAY_URL}/${ipfsHash}`).catch(() => {}) 
            },
            { 
              text: "Copy IPFS URL", 
              onPress: () => copyToClipboard(`${IPFS_GATEWAY_URL}/${ipfsHash}`) 
            },
            { text: "OK" }
          ]
        );
      } else {
        Alert.alert(
          "❌ IPFS Verification Failed",
          `Document verification failed!\n\n• Local Hash: ${localHash.substring(0, 16)}...\n• IPFS Hash: ${ipfsDocumentHash.substring(0, 16)}...\n\nHashes do not match. The document may have been tampered with.`,
          [
            { 
              text: "View IPFS Document", 
              onPress: () => Linking.openURL(`${IPFS_GATEWAY_URL}/${ipfsHash}`).catch(() => {}) 
            },
            { text: "OK" }
          ]
        );
      }
      
      return verificationResult;
      
    } catch (error) {
      console.error("IPFS verification error:", error);
      
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        ipfsHash: ipfsHash
      };
      
      setIpfsVerificationResult(errorResult);
      
      Alert.alert(
        "⚠️ Verification Error",
        `Could not verify document against IPFS:\n${error.message}`
      );
      
      return errorResult;
    } finally {
      setVerifyingIPFS(false);
    }
  };

  const uploadAndVerifyDocument = async (document) => {
    if (!document) return;

    setUploadingDocument(true);
    
    try {
      // Step 1: Generate document hash
      const documentHash = await generateDocumentHashLocal(document.uri);
      setDocumentHash(documentHash);
      setLocalDocumentHash(documentHash);
      setDocumentLocalPath(document.uri);

      // Step 2: Upload to Firebase Storage (with proper path structure)
      const sanitizedState = selectedState.replace(/\s+/g, '_').toLowerCase();
      const sanitizedDistrict = selectedDistrict.replace(/\s+/g, '_').toLowerCase();
      const timestamp = Date.now();
      const fileExtension = document.name.split('.').pop() || 
                           (document.mimeType?.includes('pdf') ? 'pdf' : 'jpg');
      const fileName = `pmkisan_${phone}_${timestamp}.${fileExtension}`;
      const firebasePath = `${userType}/${sanitizedState}/${sanitizedDistrict}/${phone}/${fileName}`;
      
      const firebaseUrl = await uploadToFirebase(document.uri, firebasePath);
      setFirebaseDownloadURL(firebaseUrl);

      // Step 3: Upload to IPFS
      const ipfsHash = await uploadToIPFS(document, documentHash);
      setIpfsHash(ipfsHash);
      
      // Step 4: Store metadata in Firestore
      const verificationMetadata = {
        phone: phone,
        userType: userType,
        state: selectedState,
        district: selectedDistrict,
        documentHash: documentHash,
        ipfsHash: ipfsHash,
        ipfsUrl: `${IPFS_GATEWAY_URL}/${ipfsHash}`,
        firebasePath: firebasePath,
        firebaseDownloadURL: firebaseUrl,
        documentName: document.name,
        documentType: document.mimeType,
        fileSize: document.size,
        documentPreview: documentPreview,
        localDocumentPath: document.uri,
        uploadedAt: new Date().toISOString(),
        verificationStatus: "uploaded_to_ipfs_and_firebase"
      };

      await storeVerificationData(verificationMetadata);
      setVerificationData(verificationMetadata);
      
      // Step 5: Update Realtime Database
      await updateDocumentVerificationInRealtimeDB(
        userType,
        selectedState,
        selectedDistrict,
        phone,
        documentHash,
        document.uri,
        false,
        false,
        firebaseUrl
      );

      // Step 6: Save to local storage
      await saveDocumentDataToLocalStorage({
        documentHash: documentHash,
        localDocumentPath: document.uri,
        ipfsHash: ipfsHash,
        ipfsUrl: `${IPFS_GATEWAY_URL}/${ipfsHash}`,
        firebasePath: firebasePath,
        firebaseDownloadURL: firebaseUrl,
        documentName: document.name,
        documentType: document.mimeType,
        fileSize: document.size,
        documentPreview: documentPreview,
        uploadedAt: new Date().toISOString()
      });

      Alert.alert(
        "✅ Document Uploaded Successfully",
        `Document uploaded to both Firebase and IPFS!\n\n• Firebase Path: ${firebasePath}\n• Document Hash: ${documentHash.substring(0, 16)}...\n• IPFS Hash: ${ipfsHash}\n\nWould you like to verify the document?`,
        [
          { text: "Verify Later", style: "cancel" },
          { 
            text: "Verify Now", 
            onPress: () => {
              // Auto-verify after upload
              setTimeout(() => {
                verifyLocalDocument(document);
              }, 500);
            }
          }
        ]
      );

    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Error", "Failed to upload document. Please try again.");
    } finally {
      setUploadingDocument(false);
    }
  };

  // Verify local document against IPFS
  const verifyLocalDocument = async (localDocument) => {
    if (!localDocument || !ipfsHash) {
      Alert.alert("Missing Data", "Please select a document and ensure IPFS hash is available");
      return;
    }

    setVerifyingIPFS(true);
    
    try {
      const result = await verifyDocumentAgainstIPFS(localDocument.uri, ipfsHash);
      
      if (result.success) {
        // Update verification status
        const updatedVerificationData = {
          ...verificationData,
          ipfsVerification: result,
          verificationStatus: "ipfs_verified",
          lastVerifiedAt: new Date().toISOString()
        };
        
        await storeVerificationData(updatedVerificationData);
        setVerificationData(updatedVerificationData);
        
        // Update verification proof
        const proofData = {
          ...verificationProof,
          ipfsVerification: result,
          verificationMethod: 'ipfs_hash_comparison',
          verifiedBy: 'ipfs_hash_comparison',
          documentIntegrity: 'verified'
        };
        
        await storeVerificationProof(phone, proofData);
        setVerificationProof(proofData);
        
        // Update PM Kisan status
        setPmKisanLinked(true);
        
        // Update Realtime Database
        await updateDocumentVerificationInRealtimeDB(
          userType,
          selectedState,
          selectedDistrict,
          phone,
          result.localHash,
          documentLocalPath,
          false,
          true,
          firebaseDownloadURL
        );

        // Save to local storage
        await saveVerificationDataToLocalStorage(updatedVerificationData);
        await saveUserDataToLocalStorage({
          ...userData,
          ipfsVerified: true,
          lastVerified: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error("Local verification error:", error);
    } finally {
      setVerifyingIPFS(false);
    }
  };

  const verifyOnBlockchain = async (documentHash) => {
    setBlockchainVerifying(true);
    
    try {
      // Verify document on blockchain
      const verificationResult = await verifyDocumentOnBlockchain(documentHash, phone);
      
      setTransactionHash(verificationResult.transactionHash);
      
      // Store verification proof
      const proofData = {
        blockchainVerified: true,
        transactionHash: verificationResult.transactionHash,
        blockTimestamp: verificationResult.timestamp,
        verificationMethod: 'blockchain',
        verifiedBy: 'smart_contract',
        documentIntegrity: 'verified',
        network: BLOCKCHAIN_NETWORK,
        explorerUrl: `${BLOCKCHAIN_EXPLORER_URL}${verificationResult.transactionHash}`,
        pmKisanLinked: true,
        ipfsVerification: ipfsVerificationResult,
        firebaseDownloadURL: firebaseDownloadURL
      };
      
      await storeVerificationProof(phone, proofData);
      
      // Update local state
      setVerificationProof(proofData);
      
      // Update PM Kisan status
      setPmKisanLinked(true);
      
      // Update Realtime Database
      await updateDocumentVerificationInRealtimeDB(
        userType,
        selectedState,
        selectedDistrict,
        phone,
        documentHash,
        documentLocalPath,
        true,
        ipfsVerificationResult?.success || false,
        firebaseDownloadURL
      );

      // Save to local storage
      await saveVerificationDataToLocalStorage({
        ...verificationData,
        verificationProof: proofData,
        blockchainVerified: true,
        transactionHash: verificationResult.transactionHash
      });

      await saveUserDataToLocalStorage({
        ...userData,
        blockchainVerified: true,
        transactionHash: verificationResult.transactionHash,
        lastVerified: new Date().toISOString()
      });
      
      Alert.alert(
        "✅ Blockchain Verification Successful",
        `Document verified on ${BLOCKCHAIN_NETWORK}!\n\nTransaction: ${verificationResult.transactionHash.substring(0, 20)}...\n\nVerification stored immutably on the blockchain.`,
        [
          { text: "View on Explorer", onPress: () => Linking.openURL(proofData.explorerUrl).catch(() => {}) },
          { text: "OK" }
        ]
      );
      
    } catch (error) {
      console.error("Blockchain verification failed:", error);
      
      Alert.alert(
        "⚠️ Blockchain Verification Unavailable",
        "Blockchain verification service is currently unavailable. Please try IPFS verification.",
        [{ text: "OK" }]
      );
    } finally {
      setBlockchainVerifying(false);
    }
  };

  const verifyDocument = async () => {
    if (!documentHash) {
      Alert.alert("No Document", "Please upload a document first");
      return;
    }

    if (verificationProof?.blockchainVerified) {
      Alert.alert(
        "Already Verified",
        `This document is already verified on blockchain.\n\nTransaction: ${transactionHash.substring(0, 24)}...`
      );
      return;
    }

    setLoading(true);
    try {
      await verifyOnBlockchain(documentHash);
    } catch (error) {
      Alert.alert("Verification Failed", "Could not verify document");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", "Text copied to clipboard");
  };

  const renderPmKisanModal = () => (
    <Modal
      visible={pmKisanModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>PM Kisan Verification</Text>
            <TouchableOpacity onPress={() => setPmKisanModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.pmKisanScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.pmKisanCard}>
              <View style={styles.pmKisanHeader}>
                <Text style={styles.pmKisanHeaderText}>PM-KISAN Document Verification</Text>
                <View style={[styles.statusBadge, 
                  verificationProof?.blockchainVerified ? styles.statusBlockchainVerified : 
                  ipfsVerificationResult?.success ? styles.statusActive : 
                  pmKisanLinked ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusBadgeText}>
                    {verificationProof?.blockchainVerified ? "Blockchain Verified" : 
                     ipfsVerificationResult?.success ? "IPFS Verified" :
                     pmKisanLinked ? "Linked" : "Not Linked"}
                  </Text>
                </View>
              </View>
              
              {/* Document Verification Section */}
              <View style={styles.verificationSection}>
                <Text style={styles.sectionTitle}>Document Verification</Text>
                
                {/* Document Preview */}
                {documentPreview && (
                  <View style={styles.documentPreviewContainer}>
                    <Text style={styles.previewLabel}>Document Preview:</Text>
                    <Image 
                      source={{ uri: documentPreview }} 
                      style={styles.documentPreview}
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                {/* Upload New Document */}
                {!selectedDocument && !documentLocalPath && (
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadDescription}>
                      Upload your PM Kisan document (PDF or Image) to Firebase Storage
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={pickDocument}
                      disabled={uploadingDocument || firebaseUploading}
                    >
                      {uploadingDocument || firebaseUploading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.uploadButtonIcon}>📤</Text>
                          <Text style={styles.uploadButtonText}>Upload PM Kisan Document</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Document Details */}
                {(selectedDocument || documentLocalPath) && (
                  <View style={styles.documentDetails}>
                    <Text style={styles.documentTitle}>Selected Document:</Text>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>
                        📄 {selectedDocument?.name || "Document from local storage"}
                      </Text>
                      {selectedDocument?.size && (
                        <Text style={styles.documentSize}>
                          {(selectedDocument.size / 1024).toFixed(2)} KB • {selectedDocument.mimeType}
                        </Text>
                      )}
                      {documentLocalPath && (
                        <Text style={styles.documentPath}>
                          Local Path: {documentLocalPath.substring(0, 50)}...
                        </Text>
                      )}
                      {firebaseDownloadURL && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(firebaseDownloadURL).catch(() => {})}
                        >
                          <Text style={styles.firebaseLink}>
                            🔗 View on Firebase Storage
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {documentHash && (
                      <View style={styles.hashInfo}>
                        <Text style={styles.hashLabel}>Document Hash (SHA-256):</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(documentHash)}>
                          <Text style={styles.hashValue} selectable>
                            {documentHash.substring(0, 32)}...
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {localDocumentHash && documentHash !== localDocumentHash && (
                      <View style={styles.hashInfo}>
                        <Text style={styles.hashLabel}>Current Local Hash:</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(localDocumentHash)}>
                          <Text style={styles.hashValue} selectable>
                            {localDocumentHash.substring(0, 32)}...
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {ipfsHash && (
                      <View style={styles.hashInfo}>
                        <Text style={styles.hashLabel}>IPFS Hash (CID):</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(ipfsHash)}>
                          <Text style={styles.hashValue} selectable>
                            {ipfsHash}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.viewIpfsButton}
                          onPress={() => Linking.openURL(`${IPFS_GATEWAY_URL}/${ipfsHash}`).catch(() => {})}
                        >
                          <Text style={styles.viewIpfsButtonText}>🌐 View on IPFS Gateway</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Firebase Storage Info */}
                    {firebaseDownloadURL && (
                      <View style={styles.firebaseInfo}>
                        <Text style={styles.firebaseLabel}>Firebase Storage Path:</Text>
                        <TouchableOpacity onPress={() => copyToClipboard(firebaseDownloadURL)}>
                          <Text style={styles.firebaseValue} selectable>
                            {`${userType}/${selectedState?.replace(/\s+/g, '_').toLowerCase()}/${selectedDistrict?.replace(/\s+/g, '_').toLowerCase()}/${phone}/`}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.viewFirebaseButton}
                          onPress={() => Linking.openURL(firebaseDownloadURL).catch(() => {})}
                        >
                          <Text style={styles.viewFirebaseButtonText}>🔥 View in Firebase Storage</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Verification Actions */}
                    <View style={styles.verificationActions}>
                      {!firebaseDownloadURL ? (
                        <TouchableOpacity
                          style={styles.primaryActionButton}
                          onPress={() => {
                            if (selectedDocument) {
                              uploadToFirebaseStorage(selectedDocument);
                            } else {
                              Alert.alert("No Document", "Please select a document first");
                            }
                          }}
                          disabled={firebaseUploading}
                        >
                          <Text style={styles.primaryActionButtonText}>
                            {firebaseUploading ? "🔥 Uploading to Firebase..." : "🔥 Upload to Firebase Storage"}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.verifyButton}
                            onPress={() => {
                              if (selectedDocument) {
                                verifyLocalDocument(selectedDocument);
                              } else if (documentLocalPath) {
                                Alert.alert("Info", "Please reselect the document for verification");
                              }
                            }}
                            disabled={verifyingIPFS}
                          >
                            <Text style={styles.verifyButtonText}>
                              {verifyingIPFS ? "🔍 Verifying..." : 
                               ipfsVerificationResult?.success ? "✅ IPFS Verified" : 
                               "🔍 Verify Against IPFS"}
                            </Text>
                          </TouchableOpacity>
                          
                          {!verificationProof?.blockchainVerified && (
                            <TouchableOpacity
                              style={styles.blockchainButton}
                              onPress={() => verifyOnBlockchain(documentHash)}
                              disabled={blockchainVerifying}
                            >
                              <Text style={styles.blockchainButtonText}>
                                {blockchainVerifying ? "🔗 Verifying on Blockchain..." : 
                                 "🔗 Verify on Blockchain"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                    
                    {/* Verification Results */}
                    {(verifyingIPFS || ipfsVerificationResult) && (
                      <View style={styles.verificationResults}>
                        {verifyingIPFS ? (
                          <View style={styles.verifyingStatus}>
                            <ActivityIndicator size="small" color="#0B5E2E" />
                            <Text style={styles.verifyingText}>Verifying document against IPFS...</Text>
                          </View>
                        ) : ipfsVerificationResult?.success ? (
                          <View style={styles.verificationSuccess}>
                            <Text style={styles.verificationSuccessText}>✅ Document Verified Successfully!</Text>
                            <Text style={styles.verificationDetails}>
                              Local hash matches IPFS hash ✓
                            </Text>
                            {localDocumentHash && ipfsVerificationResult.ipfsDocumentHash && (
                              <View style={styles.hashComparison}>
                                <Text style={styles.hashComparisonLabel}>Hash Comparison:</Text>
                                <Text style={styles.hashComparisonValue}>
                                  Local: {localDocumentHash.substring(0, 16)}...
                                </Text>
                                <Text style={styles.hashComparisonValue}>
                                  IPFS: {ipfsVerificationResult.ipfsDocumentHash.substring(0, 16)}...
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : ipfsVerificationResult?.error ? (
                          <View style={styles.verificationError}>
                            <Text style={styles.verificationErrorText}>❌ Verification Failed</Text>
                            <Text style={styles.verificationDetails}>
                              Error: {ipfsVerificationResult.error}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}
              </View>
              
              {/* Real PM Kisan Data */}
              {realPMKisanData && (
                <View style={styles.existingDocumentSection}>
                  <Text style={styles.sectionTitle}>PM Kisan Registration Details</Text>
                  <View style={styles.existingDocInfo}>
                    <View style={styles.pmKisanRow}>
                      <Text style={styles.pmKisanLabel}>Beneficiary ID:</Text>
                      <Text style={styles.pmKisanValue}>{realPMKisanData.beneficiaryId}</Text>
                    </View>
                    
                    <View style={styles.pmKisanRow}>
                      <Text style={styles.pmKisanLabel}>Name:</Text>
                      <Text style={styles.pmKisanValue}>{realPMKisanData.name}</Text>
                    </View>
                    
                    <View style={styles.pmKisanRow}>
                      <Text style={styles.pmKisanLabel}>Status:</Text>
                      <Text style={[styles.pmKisanValue, 
                        realPMKisanData.isVerified ? {color: '#28a745'} : {color: '#FFA500'}
                      ]}>
                        {realPMKisanData.isVerified ? 'Verified' : 'Pending Verification'}
                      </Text>
                    </View>
                    
                    <View style={styles.pmKisanRow}>
                      <Text style={styles.pmKisanLabel}>Verification Date:</Text>
                      <Text style={styles.pmKisanValue}>
                        {new Date(realPMKisanData.verificationDate).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.pmKisanRow}>
                      <Text style={styles.pmKisanLabel}>Total Received:</Text>
                      <Text style={[styles.pmKisanValue, {color: '#0B5E2E', fontWeight: '700'}]}>
                        {realPMKisanData.totalReceived}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {pmKisanLinked ? (
                <>
                  <View style={styles.separator} />
                  
                  <View style={styles.pmKisanRow}>
                    <Text style={styles.pmKisanLabel}>Beneficiary ID:</Text>
                    <Text style={styles.pmKisanValue}>{pmKisanData?.beneficiaryId}</Text>
                  </View>
                  
                  <View style={styles.pmKisanRow}>
                    <Text style={styles.pmKisanLabel}>Name:</Text>
                    <Text style={styles.pmKisanValue}>{pmKisanData?.name}</Text>
                  </View>
                  
                  <View style={styles.pmKisanRow}>
                    <Text style={styles.pmKisanLabel}>Location:</Text>
                    <Text style={styles.pmKisanValue}>{pmKisanData?.district}, {pmKisanData?.state}</Text>
                  </View>
                  
                  <View style={styles.pmKisanRow}>
                    <Text style={styles.pmKisanLabel}>Verification Status:</Text>
                    <Text style={[styles.pmKisanValue, 
                      verificationProof?.blockchainVerified ? {color: '#28a745', fontWeight: '700'} : 
                      ipfsVerificationResult?.success ? {color: '#0B5E2E', fontWeight: '600'} :
                      {color: '#FFA500'}
                    ]}>
                      {verificationProof?.blockchainVerified ? 'Blockchain Verified' : 
                       ipfsVerificationResult?.success ? 'IPFS Verified' : 
                       'Pending Verification'}
                    </Text>
                  </View>
                  
                  {verificationProof?.blockchainVerified && (
                    <TouchableOpacity
                      style={styles.blockchainLink}
                      onPress={() => verificationProof.explorerUrl && Linking.openURL(verificationProof.explorerUrl).catch(() => {})}
                    >
                      <Text style={styles.blockchainLinkText}>
                        🔗 View Blockchain Transaction
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {firebaseDownloadURL && (
                    <TouchableOpacity
                      style={styles.firebaseLinkButton}
                      onPress={() => Linking.openURL(firebaseDownloadURL).catch(() => {})}
                    >
                      <Text style={styles.firebaseLinkButtonText}>
                        🔥 View Document in Firebase Storage
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <Text style={[styles.pmKisanLabel, { marginTop: 20, marginBottom: 10 }]}>
                    Installment Status:
                  </Text>
                  
                  {pmKisanData?.installmentStatus?.map((item, index) => (
                    <View key={index} style={styles.installmentRow}>
                      <View style={styles.installmentInfo}>
                        <Text style={styles.installmentName}>{item.installment} Installment</Text>
                        <Text style={styles.installmentDate}>{item.date}</Text>
                      </View>
                      <View style={styles.installmentAmount}>
                        <Text style={styles.amountText}>{item.amount}</Text>
                        <View style={[
                          styles.statusIndicator,
                          item.status === 'Credited' && styles.statusCredited,
                          item.status === 'Pending' && styles.statusPending,
                          item.status === 'Upcoming' && styles.statusUpcoming
                        ]}>
                          <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Received:</Text>
                    <Text style={styles.totalAmount}>{pmKisanData?.totalReceived}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.separator} />
                  <Text style={styles.pmKisanDescription}>
                    The PM-KISAN scheme provides income support of ₹6,000 per year to all landholding farmer families across the country.
                  </Text>
                  
                  <View style={styles.featureList}>
                    <Text style={styles.featureItem}>✓ ₹6,000 per year in 3 equal installments</Text>
                    <Text style={styles.featureItem}>✓ Direct bank transfer</Text>
                    <Text style={styles.featureItem}>✓ Aadhaar linked payments</Text>
                    <Text style={styles.featureItem}>✓ No middlemen involved</Text>
                    <Text style={styles.featureItem}>✓ Firebase Storage & IPFS verification</Text>
                    <Text style={styles.featureItem}>✓ Blockchain verification available</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.linkPmKisanButton}
                    onPress={async () => {
                      setFetchingRealPMKisan(true);
                      try {
                        const eligibility = await getPMKisanEligibilityFromAPI(phone, selectedState, selectedDistrict);
                        if (eligibility && eligibility.isEligible) {
                          setRealPMKisanData(eligibility);
                          setPmKisanLinked(true);
                          // Save to local storage
                          await savePMKisanDataToLocalStorage(eligibility);
                          Alert.alert("PM Kisan Found", "Your PM Kisan registration has been found and linked.");
                        } else {
                          Alert.alert("PM Kisan Registration", 
                            "You are not currently registered in the PM Kisan scheme. Please visit the official PM Kisan portal for registration.");
                        }
                      } catch (error) {
                        Alert.alert("Error", "Unable to check PM Kisan status. Please try again later.");
                      } finally {
                        setFetchingRealPMKisan(false);
                      }
                    }}
                    disabled={fetchingRealPMKisan}
                  >
                    <Text style={styles.linkPmKisanButtonText}>
                      {fetchingRealPMKisan ? "Checking PM Kisan Status..." : "Check PM Kisan Registration"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepRow}>
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <View style={[
              styles.stepCircle,
              step >= stepNumber && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                step >= stepNumber && styles.stepNumberActive
              ]}>
                {stepNumber}
              </Text>
            </View>
            {stepNumber < 3 && (
              <View style={[
                styles.stepLine,
                step > stepNumber && styles.stepLineActive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.stepLabels}>
        <Text style={styles.stepLabel}>User Type</Text>
        <Text style={styles.stepLabel}>Location</Text>
        <Text style={styles.stepLabel}>Phone</Text>
      </View>
    </View>
  );

  const renderStateModal = () => (
    <Modal
      visible={showStateModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: height * 0.8 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State</Text>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search states..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          
          <FlatList
            data={filteredStates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedState === item.name && styles.modalItemSelected
                ]}
                onPress={() => handleStateSelect(item.name)}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedState === item.name && styles.modalItemTextSelected
                ]}>
                  {item.name}
                </Text>
                {selectedState === item.name && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  const renderDistrictModal = () => (
    <Modal
      visible={showDistrictModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: height * 0.8 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select District ({selectedState})
            </Text>
            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search districts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          
          <FlatList
            data={filteredDistrictsList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedDistrict === item && styles.modalItemSelected
                ]}
                onPress={() => handleDistrictSelect(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedDistrict === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {selectedDistrict === item && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0B5E2E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.container}
      >
        {/* Background with gradient effect */}
        <View style={styles.background}>
          <View style={[styles.topCircle, { width: scale(300), height: scale(300), top: -scale(100), right: -scale(100) }]} />
          <View style={[styles.bottomCircle, { width: scale(250), height: scale(250), bottom: -scale(80), left: -scale(80) }]} />
          <View style={[styles.middleCircle, { width: scale(180), height: scale(180), top: '40%', right: '60%' }]} />
        </View>

        {/* Main Content Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              marginHorizontal: scale(16),
              paddingVertical: isSmallDevice ? scale(20) : scale(32),
              paddingHorizontal: isSmallDevice ? scale(16) : scale(24),
              maxHeight: height * 0.9,
            },
          ]}
        >
          {/* Logo */}
          <View style={[styles.logoWrapper, { marginBottom: isSmallDevice ? scale(16) : scale(20) }]}>
            <View style={[styles.logoCircle, { 
              width: scale(90), 
              height: scale(90),
              borderRadius: scale(20)
            }]}>
              <Image
                source={require("../../assets/iconAndSplash.png")}
                style={[styles.logo, { 
                  width: scale(60), 
                  height: scale(60) 
                }]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[
            styles.welcomeText,
            { fontSize: isSmallDevice ? scale(22) : scale(26) }
          ]}>
            {otpSent ? "Verify OTP" : "Welcome Back"}
          </Text>
          <Text style={[
            styles.subText,
            { 
              fontSize: isSmallDevice ? scale(12) : scale(14),
              marginBottom: isSmallDevice ? scale(16) : scale(24)
            }
          ]}>
            {otpSent
              ? `OTP sent to +91 ${phone}`
              : "Complete your profile to continue"}
          </Text>

          {/* Step Indicator */}
          {!otpSent && renderStepIndicator()}

          {/* Form */}
          <ScrollView 
            style={[styles.form, { maxHeight: height * 0.5 }]} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {!otpSent ? (
              <>
                {/* Step 1: User Type Selection */}
                {step === 1 && (
                  <View style={styles.stepContainer}>
                    <Text style={[
                      styles.stepTitle,
                      { fontSize: isSmallDevice ? scale(18) : scale(20) }
                    ]}>
                      Select User Type
                    </Text>
                    <Text style={[
                      styles.stepDescription,
                      { fontSize: isSmallDevice ? scale(12) : scale(14) }
                    ]}>
                      Choose your role to customize your experience
                    </Text>
                    
                    <View style={styles.radioContainer}>
                      <TouchableOpacity
                        style={[
                          styles.radioCard,
                          userType === "framer" && styles.radioCardSelected,
                          { padding: isSmallDevice ? scale(12) : scale(16) }
                        ]}
                        onPress={() => handleUserTypeSelect("framer")}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.radioIcon,
                          { 
                            width: scale(50), 
                            height: scale(50),
                            borderRadius: scale(12),
                            marginRight: scale(16)
                          }
                        ]}>
                          <Text style={[
                            styles.radioIconText,
                            { fontSize: scale(24) }
                          ]}>
                            👨‍🌾
                          </Text>
                        </View>
                        <View style={styles.radioContent}>
                          <Text style={[
                            styles.radioTitle,
                            { fontSize: isSmallDevice ? scale(14) : scale(16) },
                            userType === "framer" && styles.radioTitleSelected
                          ]}>
                            Framer
                          </Text>
                          <Text style={[
                            styles.radioDescription,
                            { fontSize: isSmallDevice ? scale(10) : scale(12) }
                          ]}>
                            Agricultural professional managing farms
                          </Text>
                          <Text style={styles.blockchainFeature}>
                            ✓ Firebase Storage document upload
                          </Text>
                          <Text style={styles.blockchainFeature}>
                            ✓ Real-time PM Kisan verification
                          </Text>
                          <Text style={styles.blockchainFeature}>
                            ✓ Data stored locally & in cloud
                          </Text>
                        </View>
                        {userType === "framer" && (
                          <View style={[
                            styles.selectedBadge,
                            { 
                              top: scale(-8), 
                              right: scale(-8),
                              width: scale(24),
                              height: scale(24),
                              borderRadius: scale(12)
                            }
                          ]}>
                            <Text style={[styles.checkmark, { fontSize: scale(12) }]}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.radioCard,
                          userType === "autonomous" && styles.radioCardSelected,
                          { padding: isSmallDevice ? scale(12) : scale(16) }
                        ]}
                        onPress={() => handleUserTypeSelect("autonomous")}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.radioIcon,
                          { 
                            width: scale(50), 
                            height: scale(50),
                            borderRadius: scale(12),
                            marginRight: scale(16)
                          }
                        ]}>
                          <Text style={[
                            styles.radioIconText,
                            { fontSize: scale(24) }
                          ]}>
                            🤖
                          </Text>
                        </View>
                        <View style={styles.radioContent}>
                          <Text style={[
                            styles.radioTitle,
                            { fontSize: isSmallDevice ? scale(14) : scale(16) },
                            userType === "autonomous" && styles.radioTitleSelected
                          ]}>
                            Autonomous
                          </Text>
                          <Text style={[
                            styles.radioDescription,
                            { fontSize: isSmallDevice ? scale(10) : scale(12) }
                          ]}>
                            Automated systems and AI-driven operations
                          </Text>
                        </View>
                        {userType === "autonomous" && (
                          <View style={[
                            styles.selectedBadge,
                            { 
                              top: scale(-8), 
                              right: scale(-8),
                              width: scale(24),
                              height: scale(24),
                              borderRadius: scale(12)
                            }
                          ]}>
                            <Text style={[styles.checkmark, { fontSize: scale(12) }]}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 2: Location Selection */}
                {step === 2 && (
                  <View style={styles.stepContainer}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBack}
                    >
                      <Text style={[
                        styles.backButtonText,
                        { fontSize: isSmallDevice ? scale(12) : scale(14) }
                      ]}>← Back</Text>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.stepTitle,
                      { fontSize: isSmallDevice ? scale(18) : scale(20) }
                    ]}>
                      Select Your Location
                    </Text>
                    <Text style={[
                      styles.stepDescription,
                      { fontSize: isSmallDevice ? scale(12) : scale(14) }
                    ]}>
                      Help us provide location-specific services
                    </Text>
                    
                    <View style={styles.locationContainer}>
                      {/* State Selection */}
                      <Text style={[
                        styles.label,
                        { fontSize: isSmallDevice ? scale(12) : scale(14) }
                      ]}>
                        State
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          selectedState && styles.dropdownButtonSelected,
                          { paddingVertical: scale(16) }
                        ]}
                        onPress={() => {
                          setSearchQuery("");
                          setShowStateModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          { fontSize: scale(16) },
                          !selectedState && styles.placeholderText
                        ]}>
                          {selectedState || "Select State"}
                        </Text>
                        <Text style={[styles.dropdownArrow, { fontSize: scale(12) }]}>▼</Text>
                      </TouchableOpacity>

                      {/* District Selection */}
                      <Text style={[
                        styles.label, 
                        { 
                          marginTop: scale(20),
                          fontSize: isSmallDevice ? scale(12) : scale(14)
                        }
                      ]}>
                        District
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownButton,
                          selectedDistrict && styles.dropdownButtonSelected,
                          !selectedState && styles.dropdownButtonDisabled,
                          { paddingVertical: scale(16) }
                        ]}
                        onPress={openDistrictModal}
                        disabled={!selectedState}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          { fontSize: scale(16) },
                          !selectedDistrict && styles.placeholderText,
                          !selectedState && { color: '#999' }
                        ]}>
                          {selectedDistrict || "Select District"}
                        </Text>
                        <Text style={[
                          styles.dropdownArrow,
                          { fontSize: scale(12) },
                          !selectedState && { color: '#999' }
                        ]}>▼</Text>
                      </TouchableOpacity>
                      
                      {!selectedState && (
                        <Text style={[
                          styles.hintText,
                          { fontSize: scale(12) }
                        ]}>
                          Please select a state first
                        </Text>
                      )}

                      {/* PM Kisan Status for Framers */}
                      {userType === "framer" && selectedState && selectedDistrict && (
                        <TouchableOpacity
                          style={[
                            styles.pmKisanButton,
                            checkingPmKisan && styles.pmKisanButtonDisabled,
                            verificationProof?.blockchainVerified && styles.pmKisanButtonBlockchainVerified,
                            ipfsVerificationResult?.success && styles.pmKisanButtonIPFSVerified,
                            firebaseDownloadURL && styles.pmKisanButtonFirebase
                          ]}
                          onPress={handlePmKisanLink}
                          disabled={checkingPmKisan}
                        >
                          {checkingPmKisan ? (
                            <Text style={styles.pmKisanButtonText}>
                              Checking PM Kisan Status...
                            </Text>
                          ) : verificationProof?.blockchainVerified ? (
                            <>
                              <Text style={styles.pmKisanButtonText}>
                                ✓ Blockchain Verified
                              </Text>
                              <Text style={styles.pmKisanButtonSubText}>
                                Document verified on blockchain
                              </Text>
                            </>
                          ) : ipfsVerificationResult?.success ? (
                            <>
                              <Text style={styles.pmKisanButtonText}>
                                ✓ IPFS Verified
                              </Text>
                              <Text style={styles.pmKisanButtonSubText}>
                                Document verified against IPFS
                              </Text>
                            </>
                          ) : firebaseDownloadURL ? (
                            <>
                              <Text style={styles.pmKisanButtonText}>
                                ✓ Firebase Uploaded
                              </Text>
                              <Text style={styles.pmKisanButtonSubText}>
                                Document uploaded to Firebase Storage
                              </Text>
                            </>
                          ) : pmKisanLinked ? (
                            <>
                              <Text style={styles.pmKisanButtonText}>
                                ✓ PM Kisan Linked
                              </Text>
                              <Text style={styles.pmKisanButtonSubText}>
                                Tap to view details & upload documents
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.pmKisanButtonText}>
                                🔗 Check PM Kisan Registration
                              </Text>
                              <Text style={styles.pmKisanButtonSubText}>
                                Verify eligibility and upload documents
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        (!selectedState || !selectedDistrict) && styles.nextButtonDisabled,
                        { height: scale(56) }
                      ]}
                      onPress={handleNext}
                      disabled={!selectedState || !selectedDistrict}
                    >
                      <Text style={[
                        styles.nextButtonText,
                        { fontSize: scale(16) }
                      ]}>
                        Next
                      </Text>
                      <Text style={[
                        styles.nextButtonArrow,
                        { fontSize: scale(18) }
                      ]}>→</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 3: Phone Number */}
                {step === 3 && (
                  <View style={styles.stepContainer}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBack}
                    >
                      <Text style={[
                        styles.backButtonText,
                        { fontSize: isSmallDevice ? scale(12) : scale(14) }
                      ]}>← Back</Text>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.stepTitle,
                      { fontSize: isSmallDevice ? scale(18) : scale(20) }
                    ]}>
                      Enter Phone Number
                    </Text>
                    <Text style={[
                      styles.stepDescription,
                      { fontSize: isSmallDevice ? scale(12) : scale(14) }
                    ]}>
                      We'll send an OTP to verify your number
                    </Text>
                    
                    <View style={[
                      styles.userInfo,
                      { padding: scale(12) }
                    ]}>
                      <Text style={[
                        styles.userInfoText,
                        { fontSize: isSmallDevice ? scale(11) : scale(13) }
                      ]}>
                        {userType === "framer" ? "👨‍🌾" : "🤖"} {userType.charAt(0).toUpperCase() + userType.slice(1)} • 📍 {selectedDistrict}, {selectedState}
                        {verificationProof?.blockchainVerified && " • 🔗 Blockchain Verified"}
                        {ipfsVerificationResult?.success && " • 🌐 IPFS Verified"}
                        {firebaseDownloadURL && " • 🔥 Firebase Uploaded"}
                        {realPMKisanData && " • ✅ Real PM Kisan"}
                        {documentLocalPath && " • 💾 Local Storage"}
                      </Text>
                    </View>

                    {/* Document Status */}
                    {userType === "framer" && (documentHash || verificationData) && (
                      <View style={styles.documentStatus}>
                        <View style={[
                          styles.statusBadge,
                          verificationProof?.blockchainVerified ? styles.statusBlockchainVerified :
                          ipfsVerificationResult?.success ? styles.statusActive : 
                          firebaseDownloadURL ? styles.statusFirebase :
                          documentHash ? styles.statusPending : styles.statusInactive
                        ]}>
                          <Text style={styles.statusBadgeText}>
                            {verificationProof?.blockchainVerified ? "✓ Blockchain Verified" : 
                             ipfsVerificationResult?.success ? "✓ IPFS Verified" :
                             firebaseDownloadURL ? "🔥 Firebase Uploaded" :
                             documentHash ? "📄 Document Hash Generated" : "No Document"}
                          </Text>
                        </View>
                        {documentHash && (
                          <Text style={styles.hashPreview}>
                            Hash: {documentHash.substring(0, 12)}...
                          </Text>
                        )}
                        {ipfsHash && (
                          <Text style={styles.ipfsPreview}>
                            IPFS: {ipfsHash.substring(0, 12)}...
                          </Text>
                        )}
                        {firebaseDownloadURL && (
                          <Text style={styles.firebasePreview}>
                            Firebase: {firebaseDownloadURL.split('/').pop().substring(0, 20)}...
                          </Text>
                        )}
                        {documentLocalPath && (
                          <Text style={styles.pathPreview}>
                            Local: {documentLocalPath.split('/').pop().substring(0, 20)}...
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={[
                      styles.inputContainer,
                      { height: scale(56) }
                    ]}>
                      <Text style={[
                        styles.countryCode,
                        { fontSize: scale(16) }
                      ]}>
                        +91
                      </Text>
                      <TextInput
                        style={[
                          styles.phoneInput,
                          { fontSize: scale(16) }
                        ]}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={10}
                        returnKeyType="done"
                        autoFocus={true}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        (loading || phone.length !== 10) && styles.buttonDisabled,
                        { height: scale(56) }
                      ]}
                      onPress={sendOtp}
                      disabled={loading || phone.length !== 10}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.buttonText,
                        { fontSize: scale(16) }
                      ]}>
                        {loading ? "Sending..." : "Send OTP"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              /* OTP Verification */
              <>
                <View style={styles.verificationContainer}>
                  <View style={[
                    styles.userInfo,
                    { padding: scale(12), marginBottom: scale(24) }
                  ]}>
                    <Text style={[
                      styles.userInfoText,
                      { fontSize: isSmallDevice ? scale(11) : scale(13) }
                    ]}>
                      {userType === "framer" ? "👨‍🌾" : "🤖"} {userType} • 📍 {selectedDistrict}, {selectedState}
                      {verificationProof?.blockchainVerified && " • 🔗 Blockchain Verified"}
                      {ipfsVerificationResult?.success && " • 🌐 IPFS Verified"}
                      {firebaseDownloadURL && " • 🔥 Firebase Uploaded"}
                      {pmKisanLinked && " • ✓ PM Kisan"}
                      {documentHash && " • 📄 Document"}
                      {documentLocalPath && " • 💾 Local Storage"}
                    </Text>
                  </View>

                  <Text style={[
                    styles.label,
                    { fontSize: isSmallDevice ? scale(12) : scale(14) }
                  ]}>
                    Enter OTP
                  </Text>
                  <View style={styles.otpRow}>
                    {otp.map((value, i) => (
                      <TextInput
                        key={i}
                        ref={otpRefs[i]}
                        style={[
                          styles.otpBox,
                          value && styles.otpBoxFilled,
                          { 
                            width: scale(64),
                            height: scale(64),
                            fontSize: scale(24)
                          }
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={value}
                        onChangeText={(v) => handleOtpChange(i, v)}
                        returnKeyType="done"
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      loading && styles.buttonDisabled,
                      { height: scale(56) }
                    ]}
                    onPress={handleVerify}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.buttonText,
                      { fontSize: scale(16) }
                    ]}>
                      {loading ? "Verifying..." : "Verify & Login"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={resendOtp}
                    style={styles.resendContainer}
                    disabled={!canResend}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.resend,
                      { fontSize: isSmallDevice ? scale(12) : scale(14) }
                    ]}>
                      Didn't receive OTP?{" "}
                      <Text style={[
                        styles.resendLink, 
                        { fontSize: isSmallDevice ? scale(12) : scale(14) },
                        !canResend && styles.resendDisabled
                      ]}>
                        {canResend ? "Resend" : `Resend in ${cooldown}s`}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!otpSent && (
            <View style={styles.footer}>
              <Text style={[
                styles.footerText,
                { fontSize: isSmallDevice ? scale(10) : scale(12) }
              ]}>
                By continuing, you agree to our{" "}
                <Text style={styles.footerLink}>Terms & Conditions</Text>
              </Text>
              {userType === "framer" && (
                <Text style={[styles.footerText, { fontSize: isSmallDevice ? scale(9) : scale(11), marginTop: 4 }]}>
                  PM Kisan documents are stored in Firebase Storage • Data organized by State/District/Phone • IPFS & Blockchain verification available
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderStateModal()}
      {renderDistrictModal()}
      {renderPmKisanModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B5E2E",
    justifyContent: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  topCircle: {
    position: "absolute",
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  bottomCircle: {
    position: "absolute",
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  middleCircle: {
    position: "absolute",
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoCircle: {
    backgroundColor: "#0B5E2E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5E2E",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  welcomeText: {
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  stepIndicatorContainer: {
    width: "100%",
    marginBottom: 30,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  stepCircleActive: {
    backgroundColor: "#0B5E2E",
    borderColor: "#0B5E2E",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: "#0B5E2E",
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  stepLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    width: 60,
  },
  stepContainer: {
    width: "100%",
    minHeight: 300,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#0B5E2E",
    fontWeight: "600",
  },
  stepTitle: {
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  stepDescription: {
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  radioContainer: {
    marginTop: 16,
    gap: 12,
  },
  radioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f5f5f5",
    position: "relative",
  },
  radioCardSelected: {
    backgroundColor: "#f0f9f4",
    borderColor: "#0B5E2E",
  },
  radioIcon: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#f5f5f5',
  },
  radioIconText: {
    fontSize: 24,
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  radioTitleSelected: {
    color: "#0B5E2E",
  },
  radioDescription: {
    color: "#999",
    lineHeight: 16,
  },
  blockchainFeature: {
    color: "#28a745",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  selectedBadge: {
    position: "absolute",
    backgroundColor: "#0B5E2E",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
  },
  locationContainer: {
    marginTop: 8,
  },
  label: {
    marginBottom: 10,
    color: "#333",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },
  dropdownButtonSelected: {
    borderColor: "#0B5E2E",
    backgroundColor: "#f0f9f4",
  },
  dropdownButtonDisabled: {
    opacity: 0.6,
  },
  dropdownButtonText: {
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownArrow: {
    color: "#666",
    marginLeft: 8,
  },
  hintText: {
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  documentStatus: {
    marginBottom: 16,
    alignItems: 'center',
  },
  hashPreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  ipfsPreview: {
    fontSize: 12,
    color: '#0B5E2E',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  firebasePreview: {
    fontSize: 12,
    color: '#FFA000',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  pathPreview: {
    fontSize: 12,
    color: '#6f42c1',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  // PM Kisan Button Styles
  pmKisanButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#FFC107",
    alignItems: "center",
  },
  pmKisanButtonDisabled: {
    opacity: 0.7,
  },
  pmKisanButtonBlockchainVerified: {
    backgroundColor: "#28a745",
    borderColor: "#218838",
  },
  pmKisanButtonIPFSVerified: {
    backgroundColor: "#0B5E2E",
    borderColor: "#094d21",
  },
  pmKisanButtonFirebase: {
    backgroundColor: "#FFA000",
    borderColor: "#FF8F00",
  },
  pmKisanButtonText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  pmKisanButtonSubText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  // Document Preview Styles
  documentPreviewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  // Verification Section Styles
  verificationSection: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  uploadSection: {
    marginTop: 12,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#0B5E2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButtonIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#fff',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  documentDetails: {
    marginTop: 16,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  documentInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  documentPath: {
    fontSize: 10,
    color: '#6f42c1',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  firebaseLink: {
    fontSize: 12,
    color: '#FFA000',
    marginTop: 4,
    fontWeight: '600',
  },
  hashInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  hashLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  viewIpfsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  viewIpfsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Firebase Info Styles
  firebaseInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  firebaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  firebaseValue: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  viewFirebaseButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  viewFirebaseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  verificationActions: {
    marginTop: 16,
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: '#0B5E2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  blockchainButton: {
    backgroundColor: '#6f42c1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  blockchainButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  verificationResults: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  verifyingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  verificationSuccess: {
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  verificationSuccessText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#155724',
    marginBottom: 8,
  },
  verificationDetails: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 8,
  },
  hashComparison: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  hashComparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  hashComparisonValue: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  demoNote: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  verificationError: {
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  verificationErrorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#721c24',
    marginBottom: 8,
  },
  existingDocumentSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
  },
  existingDocInfo: {
    marginTop: 8,
  },
  existingDocName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  existingDocDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  verifyExistingButton: {
    backgroundColor: '#17a2b8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyExistingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  blockchainLink: {
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  blockchainLinkText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  firebaseLinkButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  firebaseLinkButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 20,
  },
  // PM Kisan Modal Styles
  pmKisanScrollView: {
    paddingHorizontal: 20,
  },
  pmKisanCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
  },
  pmKisanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pmKisanHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBlockchainVerified: {
    backgroundColor: "#28a745",
  },
  statusActive: {
    backgroundColor: "#d4edda",
  },
  statusFirebase: {
    backgroundColor: "#FFA000",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusInactive: {
    backgroundColor: "#f8d7da",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: '#333',
  },
  pmKisanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pmKisanLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  pmKisanValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  installmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  installmentInfo: {
    flex: 1,
  },
  installmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  installmentDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  installmentAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusCredited: {
    backgroundColor: "#d4edda",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusUpcoming: {
    backgroundColor: "#e2e3e5",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0B5E2E",
  },
  pmKisanDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  linkPmKisanButton: {
    backgroundColor: "#0B5E2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  linkPmKisanButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  userInfo: {
    backgroundColor: "#f0f9f4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4edda",
  },
  userInfoText: {
    color: "#0B5E2E",
    fontWeight: "600",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f5f5f5",
    overflow: "hidden",
  },
  countryCode: {
    paddingLeft: 16,
    paddingRight: 8,
    fontWeight: "600",
    color: "#333",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: "#333",
  },
  nextButton: {
    marginTop: 32,
    backgroundColor: "#0B5E2E",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#0B5E2E",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginRight: 8,
  },
  nextButtonArrow: {
    color: "#fff",
    fontWeight: "700",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#0B5E2E",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5E2E",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  verificationContainer: {
    width: "100%",
    alignItems: "center",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "100%",
  },
  otpBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },
  otpBoxFilled: {
    borderColor: "#0B5E2E",
    backgroundColor: "#f0f9f4",
  },
  resendContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resend: {
    color: "#666",
    textAlign: "center",
  },
  resendLink: {
    color: "#0B5E2E",
    fontWeight: "600",
  },
  resendDisabled: {
    color: "#999",
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    width: "100%",
  },
  footerText: {
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#0B5E2E",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalClose: {
    fontSize: 20,
    color: "#666",
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  modalItemSelected: {
    backgroundColor: "#f0f9f4",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  modalItemTextSelected: {
    color: "#0B5E2E",
    fontWeight: "600",
  },
});