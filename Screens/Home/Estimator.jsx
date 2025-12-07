import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Keyboard, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CropBudgetCalculator = () => {
  const [landArea, setLandArea] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [seedCost, setSeedCost] = useState('');
  const [fertilizerCost, setFertilizerCost] = useState('');
  const [pesticideCost, setPesticideCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [irrigationCost, setIrrigationCost] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [profitPerAcre, setProfitPerAcre] = useState(0);

  const crops = [
    { name: 'Rice', icon: '🌾', seed: 1500, fertilizer: 3000, pesticide: 2000, labor: 4000, yield: 2500, price: 25 },
    { name: 'Wheat', icon: '🌾', seed: 1200, fertilizer: 2500, pesticide: 1500, labor: 3500, yield: 2000, price: 22 },
    { name: 'Corn', icon: '🌽', seed: 1800, fertilizer: 3500, pesticide: 2500, labor: 4500, yield: 3000, price: 20 },
    { name: 'Soybean', icon: '🫘', seed: 1600, fertilizer: 2800, pesticide: 1800, labor: 3800, yield: 1800, price: 30 },
    { name: 'Cotton', icon: '🌱', seed: 2000, fertilizer: 4000, pesticide: 3000, labor: 5000, yield: 1500, price: 50 },
  ];

  const calculateBudget = () => {
    Keyboard.dismiss();
    const area = parseFloat(landArea) || 1;
    const cropData = crops.find(crop => crop.name === selectedCrop) || crops[0];
    
    const seed = parseFloat(seedCost) || cropData.seed;
    const fertilizer = parseFloat(fertilizerCost) || cropData.fertilizer;
    const pesticide = parseFloat(pesticideCost) || cropData.pesticide;
    const labor = parseFloat(laborCost) || cropData.labor;
    const irrigation = parseFloat(irrigationCost) || 0;
    const other = parseFloat(otherCosts) || 0;
    const yieldPerAcre = parseFloat(expectedYield) || cropData.yield;
    const price = parseFloat(marketPrice) || cropData.price;

    const calculatedTotalCost = (seed + fertilizer + pesticide + labor + irrigation + other) * area;
    const calculatedRevenue = (yieldPerAcre * price) * area;
    const calculatedProfit = calculatedRevenue - calculatedTotalCost;
    const calculatedProfitPerAcre = calculatedProfit / area;

    setTotalCost(calculatedTotalCost.toFixed(2));
    setTotalRevenue(calculatedRevenue.toFixed(2));
    setProfit(calculatedProfit.toFixed(2));
    setProfitPerAcre(calculatedProfitPerAcre.toFixed(2));
  };

  const resetCalculator = () => {
    setLandArea('');
    setSeedCost('');
    setFertilizerCost('');
    setPesticideCost('');
    setLaborCost('');
    setIrrigationCost('');
    setOtherCosts('');
    setExpectedYield('');
    setMarketPrice('');
    setTotalCost(0);
    setTotalRevenue(0);
    setProfit(0);
    setProfitPerAcre(0);
  };

  const loadCropDefaults = (cropName) => {
    const crop = crops.find(c => c.name === cropName);
    if (crop) {
      setSeedCost(crop.seed.toString());
      setFertilizerCost(crop.fertilizer.toString());
      setPesticideCost(crop.pesticide.toString());
      setLaborCost(crop.labor.toString());
      setExpectedYield(crop.yield.toString());
      setMarketPrice(crop.price.toString());
    }
  };

  const InputField = ({ label, value, onChangeText, icon }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter value"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🌾 Crop Budget</Text>
        <Text style={styles.headerSubtitle}>Calculate your farming profitability</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Land Area Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📐 Land Information</Text>
          <InputField 
            label="Land Area (acres)" 
            value={landArea} 
            onChangeText={setLandArea}
            icon="🏞️"
          />
        </View>

        {/* Crop Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Select Your Crop</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cropScroll}
          >
            {crops.map((crop) => (
              <TouchableOpacity
                key={crop.name}
                style={[
                  styles.cropCard,
                  selectedCrop === crop.name && styles.selectedCropCard
                ]}
                onPress={() => {
                  setSelectedCrop(crop.name);
                  loadCropDefaults(crop.name);
                }}
              >
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <Text style={[
                  styles.cropName,
                  selectedCrop === crop.name && styles.selectedCropName
                ]}>
                  {crop.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cost Inputs Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Cost Breakdown (per acre)</Text>
          <InputField label="Seed Cost (₹)" value={seedCost} onChangeText={setSeedCost} icon="🌱" />
          <InputField label="Fertilizer Cost (₹)" value={fertilizerCost} onChangeText={setFertilizerCost} icon="🧪" />
          <InputField label="Pesticide Cost (₹)" value={pesticideCost} onChangeText={setPesticideCost} icon="🦗" />
          <InputField label="Labor Cost (₹)" value={laborCost} onChangeText={setLaborCost} icon="👷" />
          <InputField label="Irrigation Cost (₹)" value={irrigationCost} onChangeText={setIrrigationCost} icon="💧" />
          <InputField label="Other Costs (₹)" value={otherCosts} onChangeText={setOtherCosts} icon="📦" />
        </View>

        {/* Revenue Projections Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Revenue Projections</Text>
          <InputField label="Expected Yield (kg/acre)" value={expectedYield} onChangeText={setExpectedYield} icon="⚖️" />
          <InputField label="Market Price (₹/kg)" value={marketPrice} onChangeText={setMarketPrice} icon="💵" />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateBudget}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>📈 Calculate Budget</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetCalculator}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>🔄 Reset All</Text>
        </TouchableOpacity>

        {/* Results Card */}
        {(totalCost > 0 || totalRevenue > 0) && (
          <View style={styles.resultsCard}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.resultsHeader}
            >
              <Text style={styles.resultsTitle}>📋 Budget Analysis</Text>
            </LinearGradient>
            
            <View style={styles.resultsContent}>
              <View style={styles.resultItem}>
                <View style={styles.resultIconWrapper}>
                  <Text style={styles.resultEmoji}>💸</Text>
                </View>
                <View style={styles.resultTextWrapper}>
                  <Text style={styles.resultLabel}>Total Cost</Text>
                  <Text style={styles.resultValue}>₹ {parseFloat(totalCost).toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultItem}>
                <View style={styles.resultIconWrapper}>
                  <Text style={styles.resultEmoji}>💰</Text>
                </View>
                <View style={styles.resultTextWrapper}>
                  <Text style={styles.resultLabel}>Total Revenue</Text>
                  <Text style={styles.resultValue}>₹ {parseFloat(totalRevenue).toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultItem}>
                <View style={styles.resultIconWrapper}>
                  <Text style={styles.resultEmoji}>{profit >= 0 ? '✅' : '❌'}</Text>
                </View>
                <View style={styles.resultTextWrapper}>
                  <Text style={styles.resultLabel}>Total {profit >= 0 ? 'Profit' : 'Loss'}</Text>
                  <Text style={[styles.resultValue, profit >= 0 ? styles.profitText : styles.lossText]}>
                    ₹ {parseFloat(profit).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultItem}>
                <View style={styles.resultIconWrapper}>
                  <Text style={styles.resultEmoji}>📍</Text>
                </View>
                <View style={styles.resultTextWrapper}>
                  <Text style={styles.resultLabel}>Profit per Acre</Text>
                  <Text style={[styles.resultValue, profitPerAcre >= 0 ? styles.profitText : styles.lossText]}>
                    ₹ {parseFloat(profitPerAcre).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with 💚 for farmers</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2d3748',
  },
  cropScroll: {
    marginHorizontal: -5,
  },
  cropCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectedCropCard: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  cropIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  selectedCropName: {
    color: '#fff',
  },
  calculateButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#11998e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  resultsHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  resultsContent: {
    padding: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resultIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultTextWrapper: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  profitText: {
    color: '#38a169',
  },
  lossText: {
    color: '#e53e3e',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#a0aec0',
  },
});

export default CropBudgetCalculator;