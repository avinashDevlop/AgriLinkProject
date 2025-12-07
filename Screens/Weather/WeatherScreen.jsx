import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Animated, 
  RefreshControl,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Your OpenWeather API key
const API_KEY = '464d84f2a169bd78555b577306f601bc';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Helper function to get dynamic background gradient
const getGradientColors = (condition, isDay) => {
  if (!condition) return ['#1A2980', '#26D0CE'];
  
  const lowerCondition = condition.toLowerCase();
  
  if (isDay) {
    if (lowerCondition.includes('clear')) {
      return ['#56CCF2', '#2F80ED'];
    } else if (lowerCondition.includes('cloud')) {
      return ['#757F9A', '#D7DDE8'];
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return ['#0F2027', '#203A43', '#2C5364'];
    } else if (lowerCondition.includes('thunder')) {
      return ['#232526', '#414345'];
    } else if (lowerCondition.includes('snow')) {
      return ['#E6DADA', '#274046'];
    } else {
      return ['#1A2980', '#26D0CE'];
    }
  } else {
    if (lowerCondition.includes('clear')) {
      return ['#0F2027', '#203A43', '#2C5364'];
    } else if (lowerCondition.includes('cloud')) {
      return ['#2C3E50', '#4CA1AF'];
    } else {
      return ['#0F2027', '#203A43'];
    }
  }
};

// Helper function to get weather icon
const getWeatherIcon = (condition, isDay = true) => {
  if (!condition) return { name: 'weather-partly-cloudy', lib: MaterialCommunityIcons, color: '#DDDDDD' };
  
  const lowerCondition = condition.toLowerCase();
  const iconColor = isDay ? '#FFD700' : '#6495ED';
  
  if (lowerCondition.includes('clear')) {
    return { 
      name: isDay ? 'weather-sunny' : 'weather-night', 
      lib: MaterialCommunityIcons, 
      color: iconColor 
    };
  } else if (lowerCondition.includes('cloud')) {
    return { 
      name: 'weather-cloudy', 
      lib: MaterialCommunityIcons, 
      color: '#DDDDDD' 
    };
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return { 
      name: 'weather-rainy', 
      lib: MaterialCommunityIcons, 
      color: '#6495ED' 
    };
  } else if (lowerCondition.includes('thunder')) {
    return { 
      name: 'weather-lightning', 
      lib: MaterialCommunityIcons, 
      color: '#FFA500' 
    };
  } else if (lowerCondition.includes('snow')) {
    return { 
      name: 'weather-snowy', 
      lib: MaterialCommunityIcons, 
      color: '#FFFFFF' 
    };
  } else if (lowerCondition.includes('mist') || lowerCondition.includes('fog')) {
    return { 
      name: 'weather-fog', 
      lib: MaterialCommunityIcons, 
      color: '#AAAAAA' 
    };
  } else {
    return { 
      name: 'weather-partly-cloudy', 
      lib: MaterialCommunityIcons, 
      color: '#DDDDDD' 
    };
  }
};

// Format temperature from Kelvin
const formatTemp = (kelvin, unit = 'F') => {
  if (unit === 'F') {
    return Math.round(((kelvin - 273.15) * 9/5) + 32);
  }
  return Math.round(kelvin - 273.15);
};

// Format time
const formatTime = (timestamp, timezoneOffset) => {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }).replace(' ', '').toLowerCase();
};

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch location
  const getLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return null;
      }

      let location = await Location.getCurrentPositionAsync({});
      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };
    } catch (err) {
      console.error('Location error:', err);
      return null;
    }
  }, []);

  // Fetch weather data
  const fetchWeatherData = useCallback(async (coords = null) => {
    try {
      let lat, lon;
      
      if (!coords) {
        // Check cache first
        const cachedData = await AsyncStorage.getItem('weatherData');
        if (cachedData) {
          setWeatherData(JSON.parse(cachedData));
        }

        const userLocation = await getLocation();
        if (!userLocation) {
          // Fallback to default location (San Francisco)
          lat = 37.7749;
          lon = -122.4194;
        } else {
          lat = userLocation.lat;
          lon = userLocation.lon;
        }
      } else {
        lat = coords.lat;
        lon = coords.lon;
      }

      // Fetch current weather
      const currentResponse = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      
      if (!currentResponse.ok) throw new Error('Weather fetch failed');
      
      const currentData = await currentResponse.json();

      // Fetch forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      
      if (!forecastResponse.ok) throw new Error('Forecast fetch failed');
      
      const forecastData = await forecastResponse.json();

      // Process data
      const processedData = {
        current: {
          temp: formatTemp(currentData.main.temp),
          condition: currentData.weather[0].main,
          description: currentData.weather[0].description,
          high: formatTemp(currentData.main.temp_max),
          low: formatTemp(currentData.main.temp_min),
          feelsLike: formatTemp(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed * 2.23694), // m/s to mph
          pressure: currentData.main.pressure,
          sunrise: formatTime(currentData.sys.sunrise, currentData.timezone),
          sunset: formatTime(currentData.sys.sunset, currentData.timezone),
          isDay: currentData.dt > currentData.sys.sunrise && currentData.dt < currentData.sys.sunset,
          location: `${currentData.name}, ${currentData.sys.country}`,
          timezone: currentData.timezone
        },
        hourly: forecastData.list.slice(0, 8).map(item => ({
          time: formatTime(item.dt, currentData.timezone),
          temp: formatTemp(item.main.temp),
          condition: item.weather[0].main
        })),
        daily: processDailyForecast(forecastData.list, currentData.timezone)
      };

      // Cache the data
      await AsyncStorage.setItem('weatherData', JSON.stringify(processedData));
      await AsyncStorage.setItem('lastFetch', Date.now().toString());
      
      setWeatherData(processedData);
      setError(null);
      return processedData;
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch weather data. Please try again.');
      
      // Try to use cached data if available
      const cachedData = await AsyncStorage.getItem('weatherData');
      if (cachedData) {
        setWeatherData(JSON.parse(cachedData));
      }
      return null;
    }
  }, []);

  // Process daily forecast
  const processDailyForecast = (forecastList, timezone) => {
    const days = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    forecastList.forEach(item => {
      const date = new Date((item.dt + timezone) * 1000);
      const dayKey = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      if (!days[dayKey]) {
        days[dayKey] = {
          day: dayName,
          high: formatTemp(item.main.temp_max),
          low: formatTemp(item.main.temp_min),
          condition: item.weather[0].main,
          date: date
        };
      } else {
        if (formatTemp(item.main.temp_max) > days[dayKey].high) {
          days[dayKey].high = formatTemp(item.main.temp_max);
        }
        if (formatTemp(item.main.temp_min) < days[dayKey].low) {
          days[dayKey].low = formatTemp(item.main.temp_min);
        }
      }
    });

    return Object.values(days).slice(0, 7);
  };

  // Initial load
  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      await fetchWeatherData();
      setLoading(false);
    };
    
    loadWeather();
  }, []);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeatherData();
    setRefreshing(false);
  }, []);

  // Handle retry
  const handleRetry = () => {
    setLoading(true);
    fetchWeatherData().finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F80ED" />
        <Text style={styles.loadingText}>Fetching weather data...</Text>
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="weather-cloudy-alert" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={handleRetry}>
          Tap to retry
        </Text>
      </View>
    );
  }

  const current = weatherData?.current;
  const isDay = current?.isDay ?? true;
  const currentIcon = getWeatherIcon(current?.condition, isDay);
  const IconComponent = currentIcon.lib;
  const gradientColors = getGradientColors(current?.condition, isDay);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.background}
      >
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          {/* Current Weather */}
          <View style={styles.currentWeatherContainer}>
            <View style={styles.locationContainer}>
              <FontAwesome name="map-marker" size={20} color="white" />
              <Text style={styles.locationText}>{current?.location || 'Loading...'}</Text>
            </View>
            
            <View style={styles.tempContainer}>
              <Text style={styles.tempText}>{current?.temp || '--'}°</Text>
              <IconComponent 
                name={currentIcon.name} 
                size={48} 
                color={currentIcon.color} 
                style={styles.weatherIcon}
              />
            </View>
            
            <Text style={styles.conditionText}>{current?.description || ''}</Text>
            <Text style={styles.highLowText}>
              H: {current?.high || '--'}° L: {current?.low || '--'}°
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
              {weatherData?.hourly?.map((hour, index) => {
                const hourIcon = getWeatherIcon(hour.condition, isDay);
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
            {weatherData?.daily?.map((day, index) => {
              const dayIcon = getWeatherIcon(day.condition, isDay);
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
                <Text style={styles.detailValue}>{current?.sunrise || '--'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="sunset" size={24} color="white" />
                <Text style={styles.detailLabel}>Sunset</Text>
                <Text style={styles.detailValue}>{current?.sunset || '--'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="wind" size={24} color="white" />
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{current?.windSpeed || '--'} mph</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="droplet" size={24} color="white" />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{current?.humidity || '--'}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name="thermometer" size={24} color="white" />
                <Text style={styles.detailLabel}>Feels Like</Text>
                <Text style={styles.detailValue}>{current?.feelsLike || '--'}°</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="gauge" size={24} color="white" />
                <Text style={styles.detailLabel}>Pressure</Text>
                <Text style={styles.detailValue}>{current?.pressure || '--'} hPa</Text>
              </View>
            </View>
          </View>

          {/* Last Updated */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {error && 'Using cached data. '}
              Pull down to refresh
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A2980',
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A2980',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  retryText: {
    color: '#4FC3F7',
    fontSize: 16,
    textDecorationLine: 'underline',
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
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WeatherApp;