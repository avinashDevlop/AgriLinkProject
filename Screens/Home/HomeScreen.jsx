import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
  StatusBar
} from 'react-native';
import { 
  MaterialIcons, 
  MaterialCommunityIcons, 
  Ionicons, 
  Feather 
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AgriLinkHomeScreen = ({navigation}) => {
  const [selectedTip, setSelectedTip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Get current hour for dynamic greeting
  const currentHour = new Date().getHours();
  let greeting = '';
  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  // Mock Data
  const weatherData = {
    temp: 28,
    condition: 'Sunny',
    location: 'Nueva Ecija, PH',
    humidity: 65,
    wind: 12,
  };

  // Organized farming tips by category
  const farmingTips = [
    {
      category: 'Rice Cultivation',
      tips: [
        { 
          id: '1', 
          title: 'Planting Season', 
          description: 'Best time to plant rice in Luzon is June-July for wet season and November-January for dry season',
          details: 'For optimal yield, transplant seedlings when they are 15-21 days old during wet season and 20-30 days old during dry season.'
        },
        { 
          id: '2', 
          title: 'Water Management', 
          description: 'Rice fields should maintain 2-5cm water depth during vegetative stage',
          details: 'Maintain shallow water depth (2-5cm) during vegetative stage, then gradually increase to 5-10cm during reproductive stage. Drain fields 2 weeks before harvest.'
        },
      ]
    },
    {
      category: 'Soil Health',
      tips: [
        { 
          id: '3', 
          title: 'Soil Preparation', 
          description: 'Mix 1 part compost with 3 parts soil to improve fertility',
          details: 'For best results, apply 2-3 inches of compost layer before planting. Test soil pH (ideal is 5.5-6.5) and add lime if too acidic.'
        },
        { 
          id: '4', 
          title: 'Organic Fertilizer', 
          description: 'Vermicompost provides 5x more nutrients than regular compost',
          details: 'Apply 1-2 tons of vermicompost per hectare. It contains 5-11 times more nitrogen, phosphorus, and potassium than regular compost.'
        },
      ]
    },
    {
      category: 'Pest Management',
      tips: [
        { 
          id: '5', 
          title: 'Natural Pest Control', 
          description: 'Use neem oil spray to prevent corn borers naturally',
          details: 'Mix 2 tbsp neem oil with 1 gallon water and 1 tsp liquid soap. Spray every 7-10 days, especially after rain. Effective against 200+ pests.'
        },
        { 
          id: '6', 
          title: 'Integrated Pest Management', 
          description: 'Combine biological and cultural controls',
          details: 'Use resistant varieties, maintain field sanitation, introduce natural predators like spiders, and use pheromone traps for monitoring.'
        },
      ]
    },
    {
      category: 'Harvesting',
      tips: [
        { 
          id: '7', 
          title: 'Harvest Timing', 
          description: 'Harvest when 80-85% of grains are golden yellow',
          details: 'Check grain moisture content (20-25% is ideal). Harvest too early results in immature grains, too late increases shattering losses.'
        },
        { 
          id: '8', 
          title: 'Post-Harvest', 
          description: 'Dry palay to 14% moisture within 24 hours',
          details: 'Use mechanical dryers or solar drying. Store in airtight containers with moisture absorbers to prevent fungal growth and insect infestation.'
        },
      ]
    }
  ];

  const quickActions = [
    { id: '1', name: 'Marketplace', icon: 'store', color: '#4CAF50' },
    { id: '2', name: 'Weather', icon: 'weather-partly-cloudy', color: '#2196F3' },
    { id: '3', name: 'Crop Guide', icon: 'leaf', color: '#8BC34A' },
    { id: '4', name: 'Expert Help', icon: 'account-tie', color: '#FF9800' },
  ];

  // Show tip details in modal
  const showTipDetails = (tip) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };

  // Render Farming Tip
  const renderFarmingTip = ({ item }) => (
    <TouchableOpacity 
      style={styles.tipCard}
      onPress={() => showTipDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tipContent}>
        <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFC107" />
        <View style={styles.tipText}>
          <Text style={styles.tipTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.tipDescription} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#757575" />
    </TouchableOpacity>
  );

  // Render Quick Action
  const renderQuickAction = ({ item }) => (
    <TouchableOpacity 
      style={styles.quickAction}
      activeOpacity={0.7}
      onPress={() => Alert.alert(item.name, `You selected ${item.name} feature`)}
    >
      <View style={[styles.actionIcon, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.actionText} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render category section
  const renderCategory = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.category}</Text>
      <FlatList
        data={item.tips}
        renderItem={renderFarmingTip}
        keyExtractor={tip => tip.id}
        scrollEnabled={false}
        contentContainerStyle={styles.tipsContainer}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient 
          colors={['#4CAF50', '#8BC34A']} 
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <MaterialIcons name="account-circle" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>{greeting}, Farmer!</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Estimator')}>
              <MaterialCommunityIcons name="calculator" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Weather Card */}
        <TouchableOpacity 
          style={styles.weatherCard}
          onPress={() => Alert.alert('Weather Details', `Current weather in ${weatherData.location}: ${weatherData.temp}°C, ${weatherData.condition}`)}
          activeOpacity={0.8}
        >
          <View style={styles.weatherHeader}>
            <MaterialCommunityIcons name="weather-sunny" size={30} color="#FFA000" />
            <Text style={styles.weatherLocation} numberOfLines={1}>{weatherData.location}</Text>
          </View>
          <View style={styles.weatherDetails}>
            <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Feather name="droplet" size={16} color="#2196F3" />
                <Text style={styles.statText}>{weatherData.humidity}%</Text>
              </View>
              <View style={styles.weatherStat}>
                <Feather name="wind" size={16} color="#757575" />
                <Text style={styles.statText}>{weatherData.wind} km/h</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <FlatList
          data={quickActions}
          renderItem={renderQuickAction}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContainer}
        />

        {/* Farming Tips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Farming Tips</Text>
          <TouchableOpacity onPress={() => Alert.alert('All Tips', 'Showing all farming tips')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={farmingTips}
          renderItem={renderCategory}
          keyExtractor={item => item.category}
          scrollEnabled={false}
        />

        {/* Tip Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{selectedTip?.title}</Text>
              <Text style={styles.modalCategory}>{selectedTip ? 
                farmingTips.find(cat => cat.tips.some(tip => tip.id === selectedTip.id))?.category : ''}</Text>
              <Text style={styles.modalDescription}>{selectedTip?.details}</Text>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Got it!</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: height * 0.02,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    margin: 15,
    elevation: 2,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherLocation: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    maxWidth: width * 0.7,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212121',
  },
  weatherStats: {
    flexDirection: 'row',
    gap: 15,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#757575',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 5,
  },
  seeAll: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  quickAction: {
    alignItems: 'center',
    marginRight: 20,
    width: width * 0.2,
  },
  actionIcon: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginLeft: 15,
    marginBottom: 8,
    marginTop: 5,
  },
  tipsContainer: {
    paddingHorizontal: 15,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tipText: {
    marginLeft: 10,
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
    color: '#212121',
  },
  tipDescription: {
    fontSize: 12,
    color: '#757575',
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2E7D32',
  },
  modalCategory: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 15,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
    color: '#424242',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#4CAF50',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AgriLinkHomeScreen;