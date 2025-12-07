import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  FlatList, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { 
  MaterialIcons, 
  MaterialCommunityIcons, 
  FontAwesome, 
  Ionicons,
  AntDesign
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDatabase, ref, onValue, off, push, set, remove, query, orderByChild, equalTo } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../../firebase';

const { width } = Dimensions.get('window');

// Initialize Firebase services
const database = getDatabase(app);
const auth = getAuth(app);

// Helper function to get user data path
const getUserDataPath = (userType, state, district, phoneNumber) => {
  return `users/${userType}/${state}/${district}/${phoneNumber}`;
};

const AgriLinkShopScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // Store all products from all farmers

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Categories data
  const categories = [
    { id: '1', name: 'All', icon: 'apps' },
    { id: '2', name: 'Seeds', icon: 'seed' },
    { id: '3', name: 'Fertilizer', icon: 'chemical-weapon' },
    { id: '4', name: 'Tools', icon: 'tools' },
    { id: '6', name: 'Equipment', icon: 'tractor' },
  ];

  // Load ALL products from ALL farmer profiles in Firebase Realtime Database
  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      const usersRef = ref(database, 'users');
      
      const onDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const allProductsData = [];
          
          // Iterate through all user types (framer, autonomous, etc.)
          snapshot.forEach((userTypeSnapshot) => {
            const userType = userTypeSnapshot.key;
            
            // Iterate through states
            userTypeSnapshot.forEach((stateSnapshot) => {
              const state = stateSnapshot.key;
              
              // Iterate through districts
              stateSnapshot.forEach((districtSnapshot) => {
                const district = districtSnapshot.key;
                
                // Iterate through phone numbers (users)
                districtSnapshot.forEach((userSnapshot) => {
                  const phoneNumber = userSnapshot.key;
                  const userData = userSnapshot.val();
                  
                  // Check if user has products
                  if (userData.products) {
                    const userProducts = Object.entries(userData.products).map(([productId, productData]) => ({
                      id: productId,
                      ...productData,
                      // Add seller information
                      sellerId: `${userType}/${state}/${district}/${phoneNumber}`,
                      sellerUserType: userType,
                      sellerState: state,
                      sellerDistrict: district,
                      sellerPhone: phoneNumber,
                      sellerName: userData.name || 'Unknown Farmer',
                      sellerProfileImage: userData.profileImage || userData.localProfileImage,
                      // Ensure product has required fields
                      name: productData.title || productData.name || 'Unnamed Product',
                      price: productData.price || '₹0',
                      category: productData.category || 'Uncategorized',
                      isAvailable: productData.isAvailable !== false,
                      status: productData.status || 'active'
                    }));
                    
                    allProductsData.push(...userProducts);
                  }
                });
              });
            });
          });
          
          console.log('Loaded products from farmers:', allProductsData.length);
          setAllProducts(allProductsData);
          setProducts(allProductsData); // Initially set to all products
        } else {
          console.log('No users found in database');
          Alert.alert(
            'No Products',
            'No products available from farmers yet.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Profile')
              }
            ]
          );
        }
        setLoading(false);
        setRefreshing(false);
      };

      const onError = (error) => {
        console.error('Error loading products from farmers:', error);
        Alert.alert('Error', 'Failed to load products from farmers');
        setLoading(false);
        setRefreshing(false);
      };

      // Subscribe to users data
      onValue(usersRef, onDataChange, onError);

      // Return cleanup function
      return () => {
        // Unsubscribe from users data
        off(usersRef, 'value', onDataChange);
      };
    } catch (error) {
      console.error('Error in loadAllProducts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, [database, navigation]);

  // Alternative: Load products from a central products collection
  const loadProductsFromCentralCollection = useCallback(async () => {
    try {
      setLoading(true);
      const productsRef = ref(database, 'marketplace/products');
      
      const onDataChange = (snapshot) => {
        if (snapshot.exists()) {
          const productsData = [];
          snapshot.forEach((childSnapshot) => {
            const product = {
              id: childSnapshot.key,
              ...childSnapshot.val()
            };
            // Ensure product has required fields
            if (product.name && product.price) {
              productsData.push(product);
            }
          });
          console.log('Loaded products from marketplace:', productsData.length);
          setProducts(productsData);
          setAllProducts(productsData);
        } else {
          // If no marketplace products, try loading from user profiles
          console.log('No marketplace products, loading from user profiles...');
          loadAllProducts();
          return;
        }
        setLoading(false);
        setRefreshing(false);
      };

      const onError = (error) => {
        console.error('Error loading marketplace products:', error);
        // Fallback to user profiles
        loadAllProducts();
      };

      // Subscribe to marketplace data
      onValue(productsRef, onDataChange, onError);

      // Return cleanup function
      return () => {
        // Unsubscribe from marketplace data
        off(productsRef, 'value', onDataChange);
      };
    } catch (error) {
      console.error('Error in loadProductsFromCentralCollection:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, [database, navigation, loadAllProducts]);

  // Load cart items for current user
  const loadCartItems = useCallback(() => {
    if (!currentUser) return;

    const cartRef = query(ref(database, 'cart'), orderByChild('userId'), equalTo(currentUser.uid));
    
    const onCartChange = (snapshot) => {
      if (snapshot.exists()) {
        const cartData = [];
        snapshot.forEach((childSnapshot) => {
          cartData.push({
            cartId: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        console.log('Loaded cart items:', cartData.length);
        setCartItems(cartData);
      } else {
        console.log('Cart is empty');
        setCartItems([]);
      }
    };

    const onCartError = (error) => {
      console.error('Error loading cart:', error);
    };

    // Subscribe to cart data
    onValue(cartRef, onCartChange, onCartError);

    // Return cleanup function
    return () => {
      // Unsubscribe from cart data
      off(cartRef, 'value', onCartChange);
    };
  }, [currentUser]);

  // Load data on component mount
  useEffect(() => {
    // Try loading from central marketplace first, fallback to user profiles
    const unsubscribeProducts = loadProductsFromCentralCollection();
    const unsubscribeCart = loadCartItems();

    return () => {
      // Cleanup both listeners
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeCart) unsubscribeCart();
    };
  }, [loadProductsFromCentralCollection, loadCartItems]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProductsFromCentralCollection();
  };

  // Filter products based on active category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sellerLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.isAvailable !== false && product.status === 'active';
  });

  // Add to cart function
  const addToCart = async (product) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    try {
      // Check if product already exists in cart
      const existingItem = cartItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        const cartItemRef = ref(database, `cart/${existingItem.cartId}`);
        await set(cartItemRef, {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          updatedAt: new Date().toISOString()
        });
        Alert.alert('Cart Updated', `Increased quantity of ${product.name}`);
      } else {
        // Add new item to cart
        const cartRef = ref(database, 'cart');
        const newCartItemRef = push(cartRef);
        
        const cartItem = {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.firebaseImageUrl || product.localImageUri || product.imageUri,
          sellerName: product.sellerName || 'Unknown Seller',
          sellerLocation: product.sellerLocation || `${product.sellerState}, ${product.sellerDistrict}`,
          sellerPhone: product.sellerPhone,
          userId: currentUser.uid,
          quantity: 1,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await set(newCartItemRef, cartItem);
        Alert.alert('Success', `${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  // Remove from cart
  const removeFromCart = async (cartId) => {
    try {
      const cartItemRef = ref(database, `cart/${cartId}`);
      await remove(cartItemRef);
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  // Update quantity
  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartId);
      return;
    }
    
    try {
      const item = cartItems.find(item => item.cartId === cartId);
      if (!item) return;
      
      const cartItemRef = ref(database, `cart/${cartId}`);
      await set(cartItemRef, {
        ...item,
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Calculate total cart value
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // Extract numeric price from string (e.g., "₹450" -> 450)
      const priceStr = item.price || '0';
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''));
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  // Clear cart
  const clearCart = async () => {
    try {
      for (const item of cartItems) {
        const cartItemRef = ref(database, `cart/${item.cartId}`);
        await remove(cartItemRef);
      }
      Alert.alert('Success', 'Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Render product image
  const renderProductImage = (product) => {
    if (product.firebaseImageUrl) {
      return { uri: product.firebaseImageUrl };
    } else if (product.localImageUri) {
      return { uri: product.localImageUri };
    } else if (product.imageUri && typeof product.imageUri === 'string') {
      return { uri: product.imageUri };
    } else if (product.imageUri && typeof product.imageUri === 'number') {
      return product.imageUri;
    } else {
      // Fallback image based on category
      const categoryImages = {
        'Seeds': require('../../assets/Products/Seeds/Seed_brinjal.png'),
        'Fertilizer': require('../../assets/Products/Fertilizer/Fungicide.png'),
        'Tools': require('../../assets/Products/Tools/Hoe.png'),
        'Equipment': require('../../assets/Products/Equipment/Sprayer.png')
      };
      return categoryImages[product.category] || require('../../assets/iconAndSplash.png');
    }
  };

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
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.productImageContainer}>
        <Image 
          source={renderProductImage(item)} 
          style={styles.productImage} 
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating || 4.0}</Text>
        </View>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
        {item.sellerProfileImage && (
          <TouchableOpacity 
            style={styles.sellerBadge}
            onPress={() => navigation.navigate('FarmerProfile', { 
              sellerId: item.sellerId,
              sellerName: item.sellerName 
            })}
          >
            <Image 
              source={{ uri: item.sellerProfileImage }} 
              style={styles.sellerImage} 
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name || 'Unnamed Product'}
        </Text>
        <Text style={styles.productSeller} numberOfLines={1}>
          {item.sellerName || 'Unknown Seller'}
        </Text>
        <Text style={styles.productLocation} numberOfLines={1}>
          {item.sellerLocation || item.sellerState ? `${item.sellerState}, ${item.sellerDistrict}` : 'Unknown Location'}
        </Text>
        <Text style={styles.productPrice}>
          {item.price || '₹0'}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={() => addToCart(item)}
      >
        <FontAwesome name="shopping-cart" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={item.image ? { uri: item.image } : require('../../assets/iconAndSplash.png')} 
        style={styles.cartItemImage} 
      />
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemSeller}>{item.sellerName}</Text>
        <Text style={styles.cartItemLocation}>{item.sellerLocation}</Text>
        <Text style={styles.cartItemPrice}>{item.price}</Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.cartId, (item.quantity || 1) - 1)}
        >
          <AntDesign name="minus" size={16} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity || 1}</Text>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.cartId, (item.quantity || 1) + 1)}
        >
          <AntDesign name="plus" size={16} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromCart(item.cartId)}
        >
          <MaterialIcons name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Cart Modal
  const CartModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCart}
      onRequestClose={() => setShowCart(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cartModal}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Shopping Cart ({cartItems.length})</Text>
            <View style={styles.cartHeaderButtons}>
              {cartItems.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearCartButton}
                  onPress={() => {
                    Alert.alert(
                      'Clear Cart',
                      'Are you sure you want to clear all items from your cart?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear', style: 'destructive', onPress: clearCart }
                      ]
                    );
                  }}
                >
                  <MaterialIcons name="delete-sweep" size={20} color="#f44336" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.closeCartButton}
                onPress={() => setShowCart(false)}
              >
                <AntDesign name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <MaterialIcons name="shopping-cart" size={60} color="#ddd" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtext}>Add some products to get started</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={item => item.cartId}
                contentContainerStyle={styles.cartList}
                showsVerticalScrollIndicator={false}
              />
              
              <View style={styles.cartFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalText}>Total:</Text>
                  <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={() => {
                    Alert.alert(
                      'Checkout',
                      `Proceed to checkout with total of ₹${calculateTotal().toFixed(2)}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Proceed', 
                          onPress: () => {
                            Alert.alert('Order Placed', 'Your order has been placed successfully!');
                            clearCart();
                            setShowCart(false);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.checkoutButtonText}>Checkout Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#8BC34A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AgriLink Marketplace</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.cartIconContainer}
            onPress={() => setShowCart(true)}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
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
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // Show filter options
            Alert.alert(
              'Filter Products',
              'Select filter options:',
              [
                { text: 'Price: Low to High', onPress: () => {
                  const sorted = [...filteredProducts].sort((a, b) => {
                    const priceA = parseFloat((a.price || '0').replace(/[^0-9.-]+/g, ''));
                    const priceB = parseFloat((b.price || '0').replace(/[^0-9.-]+/g, ''));
                    return priceA - priceB;
                  });
                  setProducts(sorted);
                }},
                { text: 'Price: High to Low', onPress: () => {
                  const sorted = [...filteredProducts].sort((a, b) => {
                    const priceA = parseFloat((a.price || '0').replace(/[^0-9.-]+/g, ''));
                    const priceB = parseFloat((b.price || '0').replace(/[^0-9.-]+/g, ''));
                    return priceB - priceA;
                  });
                  setProducts(sorted);
                }},
                { text: 'Rating: High to Low', onPress: () => {
                  const sorted = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                  setProducts(sorted);
                }},
                { text: 'Reset Filters', onPress: () => {
                  setProducts(allProducts);
                  setSearchQuery('');
                  setActiveCategory('All');
                }},
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading products from farmers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => `${item.id}-${item.sellerId}`}
          numColumns={2}
          columnWrapperStyle={styles.productsRow}
          contentContainerStyle={styles.productsContainer}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeCategory === 'All' ? 'All Farmer Products' : activeCategory}
                <Text style={styles.productCount}> ({filteredProducts.length})</Text>
              </Text>
              <TouchableOpacity 
                style={styles.viewFarmersButton}
                onPress={() => navigation.navigate('FarmersList')}
              >
                <Text style={styles.viewFarmersText}>View All Farmers</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyProducts}>
              <MaterialIcons name="search-off" size={60} color="#ddd" />
              <Text style={styles.emptyProductsText}>No products found</Text>
              <Text style={styles.emptyProductsSubtext}>
                {searchQuery ? 'Try a different search' : 'No products available from farmers yet'}
              </Text>
              <TouchableOpacity 
                style={styles.addProductButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.addProductButtonText}>Add Your Products</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        />
      )}

      {/* Cart Modal */}
      <CartModal />
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
    paddingTop: 40,
    paddingBottom: 15,
    elevation: 3,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIconContainer: {
    marginRight: 20,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  productCount: {
    color: '#757575',
    fontWeight: 'normal',
  },
  viewFarmersButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewFarmersText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    position: 'relative',
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
  categoryBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sellerBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  sellerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
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
    marginBottom: 2,
  },
  productLocation: {
    fontSize: 10,
    color: '#999',
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
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyProductsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
  addProductButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Cart Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cartHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  clearCartButton: {
    padding: 4,
  },
  closeCartButton: {
    padding: 4,
  },
  cartList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  cartItemSeller: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cartItemLocation: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default AgriLinkShopScreen;