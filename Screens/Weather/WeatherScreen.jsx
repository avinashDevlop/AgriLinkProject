import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Helper function to get dynamic background gradient based on weather condition
const getGradientColors = (condition) => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    return ['#56CCF2', '#2F80ED'];
  } else if (lowerCondition.includes('cloud')) {
    return ['#757F9A', '#D7DDE8'];
  } else if (lowerCondition.includes('rain')) {
    return ['#0F2027', '#203A43', '#2C5364'];
  } else if (lowerCondition.includes('snow')) {
    return ['#E6DADA', '#274046'];
  } else {
    return ['#1A2980', '#26D0CE'];
  }
};

// Helper function to get weather icon based on condition
const getWeatherIcon = (condition) => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    return { name: 'weather-sunny', lib: MaterialCommunityIcons, color: '#FFD700' };
  } else if (lowerCondition.includes('cloud')) {
    return { name: 'weather-cloudy', lib: MaterialCommunityIcons, color: '#DDDDDD' };
  } else if (lowerCondition.includes('rain')) {
    return { name: 'weather-rainy', lib: MaterialCommunityIcons, color: '#6495ED' };
  } else if (lowerCondition.includes('thunder')) {
    return { name: 'weather-lightning', lib: MaterialCommunityIcons, color: '#FFA500' };
  } else if (lowerCondition.includes('snow')) {
    return { name: 'weather-snowy', lib: MaterialCommunityIcons, color: '#FFFFFF' };
  } else {
    return { name: 'weather-partly-cloudy', lib: MaterialCommunityIcons, color: '#DDDDDD' };
  }
};

const WeatherApp = () => {
  // Mock data
  const currentWeather = {
    temp: 72,
    condition: 'Sunny',
    high: 78,
    low: 65,
    feelsLike: 74,
    humidity: 45,
    windSpeed: 8,
    uvIndex: 6,
    sunrise: '6:45 AM',
    sunset: '7:30 PM',
    location: 'San Francisco, CA',
  };

  const hourlyForecast = [
    { time: 'Now', temp: 72, condition: 'Sunny' },
    { time: '1PM', temp: 74, condition: 'Sunny' },
    { time: '2PM', temp: 76, condition: 'Partly Cloudy' },
    { time: '3PM', temp: 77, condition: 'Partly Cloudy' },
    { time: '4PM', temp: 76, condition: 'Cloudy' },
    { time: '5PM', temp: 74, condition: 'Cloudy' },
    { time: '6PM', temp: 71, condition: 'Light Rain' },
    { time: '7PM', temp: 68, condition: 'Rain' },
  ];

  const weeklyForecast = [
    { day: 'Today', high: 78, low: 65, condition: 'Sunny' },
    { day: 'Tue', high: 80, low: 66, condition: 'Sunny' },
    { day: 'Wed', high: 82, low: 68, condition: 'Partly Cloudy' },
    { day: 'Thu', high: 79, low: 67, condition: 'Light Rain' },
    { day: 'Fri', high: 75, low: 64, condition: 'Rain' },
    { day: 'Sat', high: 73, low: 63, condition: 'Heavy Rain' },
    { day: 'Sun', high: 76, low: 64, condition: 'Partly Cloudy' },
  ];

  // Animation values
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const currentIcon = getWeatherIcon(currentWeather.condition);
  const IconComponent = currentIcon.lib;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={getGradientColors(currentWeather.condition)}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView}>
          {/* Current Weather */}
          <View style={styles.currentWeatherContainer}>
            <View style={styles.locationContainer}>
              <FontAwesome name="map-marker" size={20} color="white" />
              <Text style={styles.locationText}>{currentWeather.location}</Text>
            </View>
            
            <View style={styles.tempContainer}>
              <Text style={styles.tempText}>{currentWeather.temp}°</Text>
              <IconComponent 
                name={currentIcon.name} 
                size={48} 
                color={currentIcon.color} 
                style={styles.weatherIcon}
              />
            </View>
            
            <Text style={styles.conditionText}>{currentWeather.condition}</Text>
            <Text style={styles.highLowText}>
              H: {currentWeather.high}° L: {currentWeather.low}°
            </Text>
          </View>

          {/* Hourly Forecast */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>HOURLY FORECAST</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScroll}
            >
              {hourlyForecast.map((hour, index) => {
                const hourIcon = getWeatherIcon(hour.condition);
                const HourIconComponent = hourIcon.lib;
                
                return (
                  <View key={index} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{hour.time}</Text>
                    <HourIconComponent 
                      name={hourIcon.name} 
                      size={28} 
                      color={hourIcon.color} 
                    />
                    <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Weekly Forecast */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>7-DAY FORECAST</Text>
            {weeklyForecast.map((day, index) => {
              const dayIcon = getWeatherIcon(day.condition);
              const DayIconComponent = dayIcon.lib;
              
              return (
                <View key={index} style={styles.dailyItem}>
                  <Text style={styles.dailyDay}>{day.day}</Text>
                  <DayIconComponent 
                    name={dayIcon.name} 
                    size={24} 
                    color={dayIcon.color} 
                  />
                  <View style={styles.dailyTemps}>
                    <Text style={styles.dailyHigh}>{day.high}°</Text>
                    <Text style={styles.dailyLow}>{day.low}°</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Weather Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>WEATHER DETAILS</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Feather name="sunrise" size={24} color="white" />
                <Text style={styles.detailLabel}>Sunrise</Text>
                <Text style={styles.detailValue}>{currentWeather.sunrise}</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="sunset" size={24} color="white" />
                <Text style={styles.detailLabel}>Sunset</Text>
                <Text style={styles.detailValue}>{currentWeather.sunset}</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="wind" size={24} color="white" />
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{currentWeather.windSpeed} mph</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="droplet" size={24} color="white" />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="thermometer" size={24} color="white" />
                <Text style={styles.detailLabel}>Feels Like</Text>
                <Text style={styles.detailValue}>{currentWeather.feelsLike}°</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="weather-sunny-alert" size={24} color="white" />
                <Text style={styles.detailLabel}>UV Index</Text>
                <Text style={styles.detailValue}>{currentWeather.uvIndex}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  currentWeatherContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  tempText: {
    color: 'white',
    fontSize: 80,
    fontWeight: '200',
    marginRight: 10,
    fontFamily: 'Helvetica Neue',
  },
  weatherIcon: {
    marginTop: 10,
  },
  conditionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  highLowText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 1,
  },
  hourlyScroll: {
    paddingRight: 20,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 25,
  },
  hourlyTime: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  hourlyTemp: {
    color: 'white',
    fontSize: 18,
    marginTop: 5,
    fontWeight: '300',
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  dailyDay: {
    color: 'white',
    fontSize: 18,
    width: 80,
  },
  dailyTemps: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  dailyHigh: {
    color: 'white',
    fontSize: 18,
  },
  dailyLow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
  },
});

export default WeatherApp;