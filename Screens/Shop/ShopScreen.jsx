import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, FlatList, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AgriLinkShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories data
  const categories = [
    { id: '1', name: 'All', icon: 'apps' },
    { id: '2', name: 'Seeds', icon: 'seed' },
    { id: '3', name: 'Fertilizers', icon: 'chemical-weapon' },
    { id: '4', name: 'Tools', icon: 'tools' },
    { id: '6', name: 'Equipment', icon: 'tractor' },
  ];

  // Products data
  const products = [
    {
      id: '1',
      name: 'Brinjal Seeds',
      category: 'Seeds',
      price: '₹1,250',
      rating: 4.5,
      image: require('../../assets/Products/Seeds/Seed_brinjal.png'),
      seller: 'AgriPlus',
    },
    {
      id: '2',
      name: 'Fungicide',
      category: 'Fertilizers',
      price: '₹850',
      rating: 4.2,
      image: require('../../assets/Products/Fertilizer/Fungicide.png'),
      seller: 'BioGrow',
    },
    {
      id: '6',
      name: 'Tomato Seeds Pack',
      category: 'Seeds',
      price: '₹180',
      rating: 4.3,
      image: require('../../assets/Products/Seeds/Seed_tomato.png'),
      seller: 'SeedMaster',
    },
    {
      id: '7',
      name: 'Chilli',
      category: 'Seeds',
      price: '₹180',
      rating: 4.3,
      image: require('../../assets/Products/Seeds/Seed_chilli.png'),
      seller: 'SeedMaster',
    },
    {
      id: '8',
      name: 'Coriander',
      category: 'Seeds',
      price: '₹180',
      rating: 4.3,
      image: require('../../assets/Products/Seeds/Seed_coriander.png'),
      seller: 'SeedMaster',
    },
    {
      id: '9',
      name: 'LadyFinger',
      category: 'Seeds',
      price: '₹180',
      rating: 4.3,
      image: require('../../assets/Products/Seeds/Seed_ladyfinger.png'),
      seller: 'SeedMaster',
    },
    {
      id: '10',
      name: 'Herbicide',
      category: 'Fertilizers',
      price: '₹850',
      rating: 4.2,
      image: require('../../assets/Products/Fertilizer/Herbicide.png'),
      seller: 'BioGrow',
    },
    {
      id: '11',
      name: 'Spraying Equipment',
      category: 'Equipment',
      price: '₹2,500',
      rating: 4.4,
      image: require('../../assets/Products/Equipment/Sprayer.png'),
      seller: 'FarmTech',
    },
    {
      id: '12',
      name: 'Sprinkler System',
      category: 'Equipment',
      price: '₹3,200',
      rating: 4.6,
      image: require('../../assets/Products/Equipment/Sprinkler System.png'),
      seller: 'IrrigationPro',
    },
    {
      id: '13',
      name: 'Water Pump',
      category: 'Equipment',
      price: '₹4,500',
      rating: 4.7,
      image: require('../../assets/Products/Equipment/Water Pump.png'),
      seller: 'AquaTech',
    },
    
    // Fertilizer Category
    {
      id: '14',
      name: 'Insecticide',
      category: 'Fertilizers',
      price: '₹750',
      rating: 4.3,
      image: require('../../assets/Products/Fertilizer/Insectiside.png'),
      seller: 'PestControl',
    },
    {
      id: '15',
      name: 'Pesticide',
      category: 'Fertilizers',
      price: '₹650',
      rating: 4.1,
      image: require('../../assets/Products/Fertilizer/Pesticide.png'),
      seller: 'CropGuard',
    },
    {
      id: '16',
      name: 'Weedicide',
      category: 'Fertilizers',
      price: '₹550',
      rating: 4.0,
      image: require('../../assets/Products/Fertilizer/Weedicide.jpg'),
      seller: 'WeedMaster',
    },
    
    // Tools Category
    {
      id: '17',
      name: 'Hoe',
      category: 'Tools',
      price: '₹450',
      rating: 4.5,
      image: require('../../assets/Products/Tools/Hoe.png'),
      seller: 'FarmTools',
    },
    {
      id: '18',
      name: 'Plough',
      category: 'Tools',
      price: '₹1,200',
      rating: 4.6,
      image: require('../../assets/Products/Tools/Plough.png'),
      seller: 'AgriEquip',
    },
    {
      id: '19',
      name: 'Shovel',
      category: 'Tools',
      price: '₹350',
      rating: 4.4,
      image: require('../../assets/Products/Tools/Shovel.png'),
      seller: 'GardenPro',
    }
  ];

  // Filter products based on active category
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        activeCategory === item.name && styles.activeCategoryItem
      ]}
      onPress={() => setActiveCategory(item.name)}
    >
      <MaterialCommunityIcons 
        name={item.icon} 
        size={24} 
        color={activeCategory === item.name ? '#fff' : '#4CAF50'} 
      />
      <Text 
        style={[
          styles.categoryText,
          activeCategory === item.name && styles.activeCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render product item
  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image 
           source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
          style={styles.productImage} 
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productSeller}>{item.seller}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addToCartButton}>
        <FontAwesome name="shopping-cart" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#8BC34A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AgriLink Marketplace</Text>
        <View style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <View style={styles.notificationBadge} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor="#757575"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        contentContainerStyle={styles.productsContainer}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {activeCategory === 'All' ? 'Featured Products' : activeCategory}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    elevation: 3,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#212121',
  },
  clearSearchButton: {
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    elevation: 1,
  },
  categoriesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
  },
  activeCategoryItem: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    marginLeft: 5,
    color: '#4CAF50',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  productsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productCard: {
    width: width / 2 - 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    marginHorizontal: 5,
    position: 'relative',
  },
  productImageContainer: {
    height: 120,
    width: '100%',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 2,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});

export default AgriLinkShopScreen;