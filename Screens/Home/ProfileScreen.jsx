import React, { useState } from 'react';
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
  StatusBar
} from 'react-native';
import { Ionicons, MaterialIcons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [profileImage, setProfileImage] = useState(require('../../assets/iconAndSplash.png'));
  const [products, setProducts] = useState([
    { id: '1', image: require('../../assets/Products/Seeds/Seed_brinjal.png'), title: 'Brinjal Seeds', price: '₹4.99' },
    { id: '2', image: require('../../assets/Products/Seeds/Seed_tomato.png'), title: 'Tomato Seeds', price: '₹3.99' },
    { id: '3', image: require('../../assets/Products/Seeds/Seed_chilli.png'), title: 'Chili Seeds', price: '₹2.99' },
    { id: '4', image: require('../../assets/Products/Seeds/Seed_ladyfinger.png'), title: 'Ladyfinger', price: '₹3.49' },
    { id: '5', image: require('../../assets/Products/Seeds/Seed_coriander.png'), title: 'Coriander', price: '₹2.49' },
  ]);
  const [media, setMedia] = useState([
    { id: '1', image: require('../../assets/Products/Seeds/Seed_brinjal.png'), type: 'image' },
    { id: '2', image: require('../../assets/Products/Seeds/Seed_brinjal.png'), type: 'image' },
    { id: '3', image: require('../../assets/Products/Seeds/Seed_brinjal.png'), type: 'video' },
  ]);

  const handleAddProduct = () => {
    console.log('Add product pressed');
  };

  const handleAddMedia = () => {
    console.log('Add media pressed');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={item.image} style={styles.gridImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={item.image} style={styles.gridImage} />
      {item.type === 'video' && (
        <View style={styles.videoIconContainer}>
          <FontAwesome name="play" size={width * 0.04} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <View style={styles.profileContainer}>
          {/* Profile Info Section */}
          <View style={styles.profileInfo}>
            {/* Profile Image */}
            <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
              <Image
                source={profileImage}
                style={styles.profileImage}
              />
              <View style={styles.addButton}>
                <Ionicons name="add" size={width * 0.05} color="white" />
              </View>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{products.length}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1.2K</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>356</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.name}>Jane Doe</Text>
            <Text style={styles.bio}>Organic Farmer | Seed Supplier | Sustainable Agriculture Advocate</Text>
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={width * 0.035} color="#666" />
              <Text style={styles.locationText}>California, USA</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.website}>www.organicseedshub.com</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Feather name="share-2" size={width * 0.045} color="#3897f0" />
            </TouchableOpacity>
          </View>

          {/* Highlights */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsContainer}
          >
            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <MaterialCommunityIcons name="sprout" size={width * 0.06} color="#4CAF50" />
              </View>
              <Text style={styles.highlightText}>Seeds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <MaterialCommunityIcons name="fruit-watermelon" size={width * 0.06} color="#4CAF50" />
              </View>
              <Text style={styles.highlightText}>Produce</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <MaterialCommunityIcons name="leaf" size={width * 0.06} color="#4CAF50" />
              </View>
              <Text style={styles.highlightText}>Organic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <Ionicons name="add" size={width * 0.06} color="#666" />
              </View>
              <Text style={styles.highlightText}>New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Add Buttons */}
        <View style={styles.addButtonsContainer}>
          <TouchableOpacity 
            style={styles.addItemButton} 
            onPress={handleAddProduct}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-box" size={width * 0.06} color="white" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addItemButton} 
            onPress={handleAddMedia}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-to-photos" size={width * 0.06} color="white" />
            <Text style={styles.addButtonText}>Add Media</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="shopping-bag" 
              size={width * 0.06} 
              color={activeTab === 'products' ? '#4CAF50' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'media' && styles.activeTab]}
            onPress={() => setActiveTab('media')}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name="collections" 
              size={width * 0.06} 
              color={activeTab === 'media' ? '#4CAF50' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
              Media
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        {activeTab === 'products' ? (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <FlatList
            data={media}
            renderItem={renderMediaItem}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
          />
        )}
      </ScrollView>
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
  profileContainer: {
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
    paddingTop: 20, // Added padding at the top instead of the header
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
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
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 3,
    borderColor: '#fff',
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
    marginBottom: height * 0.02,
  },
  name: {
    fontWeight: 'bold',
    fontSize: width * 0.055,
    marginBottom: height * 0.005,
    color: '#333',
  },
  bio: {
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.01,
    lineHeight: width * 0.05,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
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
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: height * 0.025,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: height * 0.012,
    alignItems: 'center',
    marginRight: width * 0.025,
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
  highlightsContainer: {
    paddingBottom: height * 0.015,
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
    marginBottom: height * 0.005,
  },
  highlightText: {
    fontSize: width * 0.032,
    color: '#333',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
  addItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    justifyContent: 'center',
    marginHorizontal: width * 0.01,
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
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: height * 0.015,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    marginLeft: width * 0.02,
    color: '#666',
    fontWeight: '600',
    fontSize: width * 0.038,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  gridContainer: {
    paddingBottom: height * 0.05,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: width * 0.002,
    backgroundColor: '#f9f9f9',
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  videoIconContainer: {
    position: 'absolute',
    top: width * 0.02,
    right: width * 0.02,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: width * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;