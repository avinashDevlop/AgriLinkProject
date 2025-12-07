import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  TextInput,
  RefreshControl,
  ScrollView
} from 'react-native';
import { 
  MaterialIcons, 
  MaterialCommunityIcons, 
  Ionicons, 
  Feather,
  FontAwesome
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AgriLinkHomeScreen = ({navigation}) => {
  const [selectedTip, setSelectedTip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home'); // 'home', 'marketplace', 'weather', 'cropGuide', 'expertHelp'
  const [refreshing, setRefreshing] = useState(false);

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
    forecast: [
      { day: 'Today', high: 30, low: 24, condition: 'Sunny' },
      { day: 'Tomorrow', high: 29, low: 25, condition: 'Partly Cloudy' },
      { day: 'Wed', high: 28, low: 25, condition: 'Rainy' },
      { day: 'Thu', high: 27, low: 24, condition: 'Rainy' },
      { day: 'Fri', high: 29, low: 25, condition: 'Cloudy' },
    ]
  };

  // Marketplace Data
  const marketplaceItems = [
    { 
      id: '1', 
      name: 'Premium Rice Seeds', 
      price: '₱850/bag', 
      seller: 'Nueva Ecija Seeds Co.',
      rating: 4.8,
      image: '🌾',
      category: 'Seeds'
    },
    { 
      id: '2', 
      name: 'Organic Fertilizer', 
      price: '₱1,200/sack', 
      seller: 'Green Earth Organics',
      rating: 4.5,
      image: '🌱',
      category: 'Fertilizers'
    },
    { 
      id: '3', 
      name: 'Hand Tractor', 
      price: '₱85,000', 
      seller: 'Farm Equipment PH',
      rating: 4.9,
      image: '🚜',
      category: 'Equipment'
    },
    { 
      id: '4', 
      name: 'Pesticide Sprayer', 
      price: '₱3,500', 
      seller: 'Agri Tools Store',
      rating: 4.3,
      image: '💦',
      category: 'Tools'
    },
    { 
      id: '5', 
      name: 'Corn Seeds', 
      price: '₱750/bag', 
      seller: 'Golden Harvest Seeds',
      rating: 4.6,
      image: '🌽',
      category: 'Seeds'
    },
    { 
      id: '6', 
      name: 'Water Pump', 
      price: '₱12,500', 
      seller: 'Irrigation Solutions',
      rating: 4.7,
      image: '💧',
      category: 'Equipment'
    },
  ];

  // Crop Guide Data
  const cropGuides = [
    {
      id: '1',
      crop: 'Rice',
      season: 'June - July / Nov - Jan',
      duration: '90-120 days',
      water: 'High',
      difficulty: 'Medium',
      tips: [
        'Plant spacing: 20x20 cm',
        'Water depth: 2-5 cm during vegetative stage',
        'Fertilizer: Apply N-P-K at 90-60-60 kg/ha'
      ]
    },
    {
      id: '2',
      crop: 'Corn',
      season: 'Year-round',
      duration: '60-100 days',
      water: 'Medium',
      difficulty: 'Easy',
      tips: [
        'Plant spacing: 75x25 cm',
        'Plant 2-3 seeds per hill',
        'Fertilizer: Apply 3 bags 14-14-14/ha'
      ]
    },
    {
      id: '3',
      crop: 'Tomato',
      season: 'Oct - Dec',
      duration: '60-90 days',
      water: 'Regular',
      difficulty: 'Medium',
      tips: [
        'Staking recommended',
        'Water at soil level, not leaves',
        'Harvest when firm and fully colored'
      ]
    },
    {
      id: '4',
      crop: 'Eggplant',
      season: 'Year-round',
      duration: '70-85 days',
      water: 'Regular',
      difficulty: 'Easy',
      tips: [
        'Space plants 60-75 cm apart',
        'Prune to 3-4 main stems',
        'Harvest every 4-5 days'
      ]
    },
  ];

  // Experts Data
  const experts = [
    {
      id: '1',
      name: 'Dr. Maria Santos',
      specialization: 'Rice Pathologist',
      experience: '15 years',
      contact: '0917-123-4567',
      available: true
    },
    {
      id: '2',
      name: 'Engr. Juan Dela Cruz',
      specialization: 'Irrigation Engineer',
      experience: '12 years',
      contact: '0922-987-6543',
      available: true
    },
    {
      id: '3',
      name: 'Prof. Robert Tan',
      specialization: 'Soil Science',
      experience: '20 years',
      contact: '0918-555-7890',
      available: false
    },
    {
      id: '4',
      name: 'Ms. Sofia Reyes',
      specialization: 'Organic Farming',
      experience: '8 years',
      contact: '0933-222-1111',
      available: true
    },
  ];

  // Farming tips data
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
    { id: '1', name: 'Marketplace', icon: 'store', color: '#4CAF50', screen: 'marketplace' },
    { id: '2', name: 'Weather', icon: 'weather-partly-cloudy', color: '#2196F3', screen: 'weather' },
    { id: '3', name: 'Crop Guide', icon: 'leaf', color: '#8BC34A', screen: 'cropGuide' },
    { id: '4', name: 'Expert Help', icon: 'account-tie', color: '#FF9800', screen: 'expertHelp' },
  ];

  // Show tip details in modal
  const showTipDetails = (tip) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };

  // Handle Quick Action Press
  const handleQuickAction = (screen) => {
    setActiveScreen(screen);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Render Marketplace Item
  const renderMarketplaceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.marketItem}
      onPress={() => Alert.alert(item.name, `Price: ${item.price}\nSeller: ${item.seller}\nRating: ⭐${item.rating}`)}
    >
      <View style={styles.itemImageContainer}>
        <Text style={styles.itemImage}>{item.image}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemSeller} numberOfLines={1}>{item.seller}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render Weather Day
  const renderWeatherDay = ({ item }) => (
    <View style={styles.weatherDay}>
      <Text style={styles.dayText}>{item.day}</Text>
      <MaterialCommunityIcons 
        name={item.condition === 'Rainy' ? 'weather-rainy' : item.condition === 'Sunny' ? 'weather-sunny' : 'weather-partly-cloudy'} 
        size={30} 
        color="#FFA000" 
      />
      <View style={styles.tempContainer}>
        <Text style={styles.tempHigh}>{item.high}°</Text>
        <Text style={styles.tempLow}>{item.low}°</Text>
      </View>
      <Text style={styles.conditionText}>{item.condition}</Text>
    </View>
  );

  // Render Crop Guide
  const renderCropGuide = ({ item }) => (
    <TouchableOpacity 
      style={styles.cropCard}
      onPress={() => Alert.alert(item.crop, `Season: ${item.season}\nDuration: ${item.duration}\nWater Needs: ${item.water}\nDifficulty: ${item.difficulty}`)}
    >
      <View style={styles.cropHeader}>
        <MaterialCommunityIcons name="sprout" size={24} color="#4CAF50" />
        <Text style={styles.cropName}>{item.crop}</Text>
      </View>
      <View style={styles.cropDetails}>
        <View style={styles.cropDetail}>
          <Feather name="calendar" size={16} color="#757575" />
          <Text style={styles.detailText}>{item.season}</Text>
        </View>
        <View style={styles.cropDetail}>
          <MaterialIcons name="schedule" size={16} color="#757575" />
          <Text style={styles.detailText}>{item.duration}</Text>
        </View>
        <View style={styles.cropDetail}>
          <Feather name="droplet" size={16} color="#757575" />
          <Text style={styles.detailText}>{item.water}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.viewTipsButton}>
        <Text style={styles.viewTipsText}>View Tips</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render Expert
  const renderExpert = ({ item }) => (
    <TouchableOpacity 
      style={styles.expertCard}
      onPress={() => Alert.alert(`Contact ${item.name}`, `Specialization: ${item.specialization}\nExperience: ${item.experience}\nContact: ${item.contact}`)}
    >
      <View style={styles.expertHeader}>
        <View style={[styles.availabilityDot, { backgroundColor: item.available ? '#4CAF50' : '#F44336' }]} />
        <MaterialCommunityIcons name="account-circle" size={40} color="#757575" />
        <View style={styles.expertInfo}>
          <Text style={styles.expertName}>{item.name}</Text>
          <Text style={styles.expertSpecialization}>{item.specialization}</Text>
        </View>
      </View>
      <View style={styles.expertDetails}>
        <View style={styles.expertDetail}>
          <MaterialIcons name="work" size={16} color="#757575" />
          <Text style={styles.expertDetailText}>{item.experience}</Text>
        </View>
        <View style={styles.expertDetail}>
          <Feather name="phone" size={16} color="#757575" />
          <Text style={styles.expertDetailText}>{item.contact}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.contactButton}>
        <Text style={styles.contactButtonText}>Contact</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render Tip Item
  const renderTipItem = ({ item }) => (
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

  // Render Home Screen Content - Now Scrollable
  const renderHomeContent = () => {
    const allTips = farmingTips.flatMap(category => category.tips);
    
    return (
      <ScrollView 
        style={styles.homeScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.homeScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
      >
        {/* Weather Card */}
        <View style={styles.weatherCardContainer}>
          <TouchableOpacity 
            style={styles.weatherCard}
            onPress={() => handleQuickAction('weather')}
            activeOpacity={0.8}
          >
            <View style={styles.weatherTopRow}>
              <View style={styles.weatherLocationContainer}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#757575" />
                <Text style={styles.weatherLocation} numberOfLines={1}>{weatherData.location}</Text>
              </View>
              <MaterialCommunityIcons name="weather-sunny" size={40} color="#FFA000" />
            </View>
            
            <View style={styles.weatherMainInfo}>
              <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
              <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherStat}>
                <View style={styles.weatherStatIcon}>
                  <Feather name="droplet" size={20} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.weatherStatValue}>{weatherData.humidity}%</Text>
                  <Text style={styles.weatherStatLabel}>Humidity</Text>
                </View>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherStat}>
                <View style={styles.weatherStatIcon}>
                  <Feather name="wind" size={20} color="#757575" />
                </View>
                <View>
                  <Text style={styles.weatherStatValue}>{weatherData.wind} km/h</Text>
                  <Text style={styles.weatherStatLabel}>Wind</Text>
                </View>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherStat}>
                <View style={styles.weatherStatIcon}>
                  <MaterialCommunityIcons name="eye" size={20} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.weatherStatValue}>Clear</Text>
                  <Text style={styles.weatherStatLabel}>Visibility</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.screen)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color, action.color + 'CC']}
                  style={styles.actionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={action.icon} size={28} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText} numberOfLines={1}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Farming Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Farming Tips</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Tips', 'Showing all farming tips')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tipsContainer}>
            {allTips.map((tip) => (
              <TouchableOpacity 
                key={tip.id}
                style={styles.tipCard}
                onPress={() => showTipDetails(tip)}
                activeOpacity={0.7}
              >
                <View style={styles.tipContent}>
                  <View style={styles.tipIconContainer}>
                    <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFC107" />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={styles.tipTitle} numberOfLines={1}>{tip.title}</Text>
                    <Text style={styles.tipDescription} numberOfLines={2}>{tip.description}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#757575" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities Section */}
        <View style={styles.recentActivities}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => Alert.alert('All Activities', 'Showing all activities')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#4CAF50" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Rice Price Increased</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityPrice}>+5%</Text>
            </View>
            
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="weather-rainy" size={24} color="#2196F3" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Rain Forecast</Text>
                <Text style={styles.activityTime}>Today, 4:00 PM</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="new-box" size={24} color="#FF9800" />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>New Product Alert</Text>
                <Text style={styles.activityTime}>Organic Fertilizer</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render Marketplace Screen
  const renderMarketplaceScreen = () => (
    <FlatList
      data={marketplaceItems}
      renderItem={renderMarketplaceItem}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={styles.marketGrid}
      contentContainerStyle={styles.marketList}
      ListHeaderComponent={
        <>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search for products..."
              placeholderTextColor="#999"
            />
            <MaterialIcons name="search" size={24} color="#757575" />
          </View>

          <View style={styles.categoryFilter}>
            {['All', 'Seeds', 'Fertilizers', 'Equipment', 'Tools'].map((category) => (
              <TouchableOpacity key={category} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    />
  );

  // Render Weather Screen
  const renderWeatherScreen = () => (
    <FlatList
      data={weatherData.forecast}
      renderItem={renderWeatherDay}
      keyExtractor={(item, index) => index.toString()}
      horizontal={false}
      contentContainerStyle={styles.weatherScreenContent}
      ListHeaderComponent={
        <>
          <View style={styles.currentWeather}>
            <View style={styles.currentWeatherHeader}>
              <MaterialCommunityIcons name="weather-sunny" size={50} color="#FFA000" />
              <View>
                <Text style={styles.currentLocation}>{weatherData.location}</Text>
                <Text style={styles.currentTemp}>{weatherData.temp}°C</Text>
                <Text style={styles.currentCondition}>{weatherData.condition}</Text>
              </View>
            </View>
            
            <View style={styles.weatherStatsGrid}>
              <View style={styles.weatherStatCard}>
                <Feather name="droplet" size={24} color="#2196F3" />
                <Text style={styles.weatherStatValue}>{weatherData.humidity}%</Text>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherStatCard}>
                <Feather name="wind" size={24} color="#757575" />
                <Text style={styles.weatherStatValue}>{weatherData.wind} km/h</Text>
                <Text style={styles.weatherStatLabel}>Wind Speed</Text>
              </View>
              <View style={styles.weatherStatCard}>
                <MaterialCommunityIcons name="weather-sunset-up" size={24} color="#FF9800" />
                <Text style={styles.weatherStatValue}>6:00 AM</Text>
                <Text style={styles.weatherStatLabel}>Sunrise</Text>
              </View>
              <View style={styles.weatherStatCard}>
                <MaterialCommunityIcons name="weather-sunset-down" size={24} color="#FF9800" />
                <Text style={styles.weatherStatValue}>6:00 PM</Text>
                <Text style={styles.weatherStatLabel}>Sunset</Text>
              </View>
            </View>
          </View>

          <Text style={styles.forecastTitle}>5-Day Forecast</Text>
        </>
      }
      ListFooterComponent={
        <View style={styles.weatherAlerts}>
          <Text style={styles.alertTitle}>Weather Alerts</Text>
          <View style={styles.alertCard}>
            <MaterialCommunityIcons name="alert" size={24} color="#F44336" />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>Heavy Rain Warning</Text>
              <Text style={styles.alertSubtext}>Expected tomorrow afternoon</Text>
            </View>
          </View>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    />
  );

  // Render Crop Guide Screen
  const renderCropGuideScreen = () => (
    <FlatList
      data={cropGuides}
      renderItem={renderCropGuide}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.cropList}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    />
  );

  // Render Expert Help Screen
  const renderExpertHelpScreen = () => (
    <FlatList
      data={experts}
      renderItem={renderExpert}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.expertList}
      ListHeaderComponent={
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search for experts..."
            placeholderTextColor="#999"
          />
          <MaterialIcons name="search" size={24} color="#757575" />
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    />
  );

  // Main Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header */}
      <LinearGradient 
        colors={['#4CAF50', '#8BC34A']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          {activeScreen === 'home' ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <MaterialIcons name="account-circle" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.greeting}>{greeting}, Farmer!</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Estimator')}>
                <MaterialCommunityIcons name="calculator" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => setActiveScreen('home')} 
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.greeting}>
                  {activeScreen === 'marketplace' && 'Marketplace'}
                  {activeScreen === 'weather' && 'Weather Report'}
                  {activeScreen === 'cropGuide' && 'Crop Guide'}
                  {activeScreen === 'expertHelp' && 'Expert Help'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Menu', 'More options')}>
                <MaterialIcons name="more-vert" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeScreen === 'home' && renderHomeContent()}
        {activeScreen === 'marketplace' && renderMarketplaceScreen()}
        {activeScreen === 'weather' && renderWeatherScreen()}
        {activeScreen === 'cropGuide' && renderCropGuideScreen()}
        {activeScreen === 'expertHelp' && renderExpertHelpScreen()}
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
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
    minHeight: 40,
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
  backButton: {
    padding: 5,
  },
  
  // Home Screen Styles
  homeScrollView: {
    flex: 1,
  },
  homeScrollContent: {
    paddingBottom: 40,
  },
  weatherCardContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherLocation: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#757575',
  },
  weatherMainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherTemp: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#212121',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#757575',
    marginTop: 5,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
  },
  weatherStat: {
    alignItems: 'center',
  },
  weatherStatIcon: {
    marginBottom: 5,
  },
  weatherStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  weatherStatLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  weatherDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    height: '70%',
    alignSelf: 'center',
  },
  
  quickActionsSection: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  tipsSection: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    alignItems: 'center',
    width: width * 0.21,
    marginBottom: 15,
  },
  actionIcon: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#424242',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
  },
  tipCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212121',
  },
  tipDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 18,
  },
  
  recentActivities: {
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityText: {
    flex: 1,
    marginLeft: 15,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  activityTime: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
  // Marketplace Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 15,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 1,
  },
  categoryChipText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  marketGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  marketList: {
    paddingBottom: 30,
  },
  marketItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: width * 0.43,
    marginBottom: 15,
    elevation: 2,
  },
  itemImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    fontSize: 40,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#212121',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSeller: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 2,
    color: '#757575',
  },
  
  // Weather Screen Styles
  weatherScreenContent: {
    paddingBottom: 30,
  },
  currentWeather: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    elevation: 2,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentLocation: {
    fontSize: 18,
    fontWeight: '500',
    color: '#757575',
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#212121',
  },
  currentCondition: {
    fontSize: 16,
    color: '#757575',
  },
  weatherStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherStatCard: {
    width: width * 0.43,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#212121',
  },
  weatherStatLabel: {
    fontSize: 12,
    color: '#757575',
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
    color: '#212121',
  },
  weatherDay: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 8,
    marginBottom: 15,
    width: width * 0.25,
    elevation: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#212121',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  tempHigh: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginRight: 5,
  },
  tempLow: {
    fontSize: 14,
    color: '#757575',
  },
  conditionText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  weatherAlerts: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    elevation: 2,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#212121',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 15,
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  alertSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  
  // Crop Guide Styles
  cropList: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30,
  },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#212121',
  },
  cropDetails: {
    marginBottom: 15,
  },
  cropDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#757575',
  },
  viewTipsButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewTipsText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Expert Help Styles
  expertList: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30,
  },
  expertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  expertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 0,
    left: 30,
    zIndex: 1,
  },
  expertInfo: {
    marginLeft: 15,
    flex: 1,
  },
  expertName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  expertSpecialization: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  expertDetails: {
    marginBottom: 15,
  },
  expertDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expertDetailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#757575',
  },
  contactButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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