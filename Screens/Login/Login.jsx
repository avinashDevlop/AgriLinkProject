import React, { useRef, useState, useEffect } from "react";
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
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [userType, setUserType] = useState("framer"); // "framer" or "autonomous"

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // refs for OTP inputs to move focus automatically
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
      // Store user type for future use
      global.userType = userType;

      // IMPORTANT: Direct Twilio calls from frontend are not secure
      // In production, use your backend server
      console.log(`Attempting to send OTP to ${userType} via Twilio...`);
      
      // For demo/testing, simulate OTP sending
      setTimeout(() => {
        setLoading(false);
        setOtp(["", "", "", ""]);
        setOtpSent(true);
        setCooldown(30);
        setCanResend(false);
        otpRefs[0].current?.focus();
        
        // Show OTP in alert for testing (remove in production)
        Alert.alert(
          "OTP Sent",
          `OTP sent successfully to ${userType}`,
          [
            {
              text: "OK",
              onPress: () => console.log("OTP:", generatedOtp, "User Type:", userType)
            }
          ]
        );
      }, 1500);

    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
      
      // Fallback to demo mode
      Alert.alert(
        "Demo Mode", 
        "Using demo mode with OTP: 1234",
        [
          {
            text: "OK",
            onPress: () => {
              global.generatedOtp = "1234";
              global.userType = userType;
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

  // Alternative: If you want to use a backend API instead
  const sendOtpViaBackend = async () => {
    try {
      // Example: Call your own backend API
      const response = await fetch('https://your-backend.com/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+91${phone}`,
          userType: userType, // Include user type in API call
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Handle successful OTP sending
        global.generatedOtp = data.otp; // If your backend returns OTP
        global.userType = userType;
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Backend error:', error);
      throw error;
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

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length !== 4) {
      Alert.alert("Incomplete OTP", "Please enter the complete 4-digit OTP.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      // Verify OTP
      const isValid = (
        code === global.generatedOtp || // From demo
        code === "1234" // Fallback demo OTP
      );
      
      if (isValid) {
        // Navigate to Main screen with user type
        navigation.replace("Main", { userType: userType });
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0B5E2E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.container}
      >
        {/* Background with gradient effect */}
        <View style={styles.background}>
          <View style={styles.topCircle} />
          <View style={styles.bottomCircle} />
          <View style={styles.middleCircle} />
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
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/iconAndSplash.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.welcomeText}>
            {otpSent ? "Verify OTP" : "Welcome Back"}
          </Text>
          <Text style={styles.subText}>
            {otpSent
              ? `OTP sent to +91 ${phone}`
              : "Sign in to continue"}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {!otpSent ? (
              <>
                {/* User Type Selection */}
                <Text style={styles.label}>Select User Type</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      userType === "framer" && styles.radioButtonSelected,
                    ]}
                    onPress={() => setUserType("framer")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {userType === "framer" && <View style={styles.radioInnerCircle} />}
                    </View>
                    <Text style={[
                      styles.radioText,
                      userType === "framer" && styles.radioTextSelected
                    ]}>
                      Framer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      userType === "autonomous" && styles.radioButtonSelected,
                    ]}
                    onPress={() => setUserType("autonomous")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {userType === "autonomous" && <View style={styles.radioInnerCircle} />}
                    </View>
                    <Text style={[
                      styles.radioText,
                      userType === "autonomous" && styles.radioTextSelected
                    ]}>
                      Autonomous
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Phone Input */}
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || phone.length !== 10) && styles.buttonDisabled,
                  ]}
                  onPress={sendOtp}
                  disabled={loading || phone.length !== 10}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP</Text>
                <View style={styles.otpRow}>
                  {otp.map((value, i) => (
                    <TextInput
                      key={i}
                      ref={otpRefs[i]}
                      style={[
                        styles.otpBox,
                        value && styles.otpBoxFilled,
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
                  ]}
                  onPress={handleVerify}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resendOtp}
                  style={styles.resendContainer}
                  disabled={!canResend}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resend}>
                    Didn't receive OTP?{" "}
                    <Text style={[styles.resendLink, !canResend && styles.resendDisabled]}>
                      {canResend ? "Resend" : `Resend in ${cooldown}s`}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          {!otpSent && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{" "}
                <Text style={styles.footerLink}>Terms & Conditions</Text>
              </Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B5E2E",
    justifyContent: "center",
    padding: 24,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  topCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -100,
    right: -100,
  },
  bottomCircle: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: -80,
    left: -80,
  },
  middleCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    top: "40%",
    right: "60%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 13,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoWrapper: {
    marginBottom: 24,
  },
  logoCircle: {
    backgroundColor: "#0B5E2E",
    width: 100,
    height: 100,
    borderRadius: 20,
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
    width: 70,
    height: 70,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    color: "#333",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  // Radio button styles
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },
  radioButtonSelected: {
    backgroundColor: "#f0f9f4",
    borderColor: "#0B5E2E",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0B5E2E",
  },
  radioText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  radioTextSelected: {
    color: "#0B5E2E",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
  button: {
    marginTop: 24,
    height: 56,
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
    fontSize: 16,
    letterSpacing: 0.5,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  otpBox: {
    width: 64,
    height: 64,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
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
    fontSize: 14,
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
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    color: "#0B5E2E",
    fontWeight: "600",
  },
});