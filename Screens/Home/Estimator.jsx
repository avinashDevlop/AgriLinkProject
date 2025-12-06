import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Keyboard } from 'react-native';

const CropBudgetCalculator = () => {
  // Input states
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

  // Result states
  const [totalCost, setTotalCost] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [profitPerAcre, setProfitPerAcre] = useState(0);

  // Common crops with default values
  const crops = [
    { name: 'Rice', seed: 1500, fertilizer: 3000, pesticide: 2000, labor: 4000, yield: 2500, price: 25 },
    { name: 'Wheat', seed: 1200, fertilizer: 2500, pesticide: 1500, labor: 3500, yield: 2000, price: 22 },
    { name: 'Corn', seed: 1800, fertilizer: 3500, pesticide: 2500, labor: 4500, yield: 3000, price: 20 },
    { name: 'Soybean', seed: 1600, fertilizer: 2800, pesticide: 1800, labor: 3800, yield: 1800, price: 30 },
    { name: 'Cotton', seed: 2000, fertilizer: 4000, pesticide: 3000, labor: 5000, yield: 1500, price: 50 },
  ];

  const calculateBudget = () => {
    Keyboard.dismiss();
    
    // Parse input values or use crop defaults
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

    // Calculations
    const calculatedTotalCost = (seed + fertilizer + pesticide + labor + irrigation + other) * area;
    const calculatedRevenue = (yieldPerAcre * price) * area;
    const calculatedProfit = calculatedRevenue - calculatedTotalCost;
    const calculatedProfitPerAcre = calculatedProfit / area;

    // Update state
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Crop Budget Calculator</Text>

      {/* Land Area */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Land Area (acres):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter land area"
          value={landArea}
          onChangeText={setLandArea}
        />
      </View>

      {/* Crop Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Select Crop:</Text>
        <View style={styles.cropButtons}>
          {crops.map((crop) => (
            <TouchableOpacity
              key={crop.name}
              style={[
                styles.cropButton,
                selectedCrop === crop.name && styles.selectedCropButton
              ]}
              onPress={() => {
                setSelectedCrop(crop.name);
                loadCropDefaults(crop.name);
              }}
            >
              <Text style={[
                styles.cropButtonText,
                selectedCrop === crop.name && styles.selectedCropButtonText
              ]}>
                {crop.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cost Inputs */}
      <Text style={styles.sectionHeader}>Cost Inputs (per acre)</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Seed Cost (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter seed cost"
          value={seedCost}
          onChangeText={setSeedCost}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fertilizer Cost (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter fertilizer cost"
          value={fertilizerCost}
          onChangeText={setFertilizerCost}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pesticide Cost (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter pesticide cost"
          value={pesticideCost}
          onChangeText={setPesticideCost}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Labor Cost (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter labor cost"
          value={laborCost}
          onChangeText={setLaborCost}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Irrigation Cost (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter irrigation cost"
          value={irrigationCost}
          onChangeText={setIrrigationCost}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Other Costs (₹):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter other costs"
          value={otherCosts}
          onChangeText={setOtherCosts}
        />
      </View>

      {/* Revenue Inputs */}
      <Text style={styles.sectionHeader}>Revenue Projections</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expected Yield (kg/acre):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter expected yield"
          value={expectedYield}
          onChangeText={setExpectedYield}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Market Price (₹/kg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter market price"
          value={marketPrice}
          onChangeText={setMarketPrice}
        />
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.button} onPress={calculateBudget}>
        <Text style={styles.buttonText}>Calculate Budget</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetCalculator}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>

      {/* Results */}
      {(totalCost > 0 || totalRevenue > 0) && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Budget Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Cost:</Text>
            <Text style={styles.resultValue}>₹{totalCost}</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Revenue:</Text>
            <Text style={styles.resultValue}>₹{totalRevenue}</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Profit:</Text>
            <Text style={[styles.resultValue, profit >= 0 ? styles.profit : styles.loss]}>
              ₹{profit} ({profit >= 0 ? 'Profit' : 'Loss'})
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Profit per Acre:</Text>
            <Text style={[styles.resultValue, profitPerAcre >= 0 ? styles.profit : styles.loss]}>
              ₹{profitPerAcre}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#3498db',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  cropButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  cropButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 5,
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  selectedCropButton: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  cropButtonText: {
    color: '#2c3e50',
  },
  selectedCropButtonText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#555',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profit: {
    color: '#27ae60',
  },
  loss: {
    color: '#e74c3c',
  },
});

export default CropBudgetCalculator;