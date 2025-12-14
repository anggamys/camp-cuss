// // src/screens/BookingScreen.js
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useAuth } from '../hooks/useAuth';
// import BottomNav from '../components/BottomNav';
// import MapViewWithRoute from '../components/MapViewWithRoute';

// const BookingScreen = ({ route, navigation }) => {
//   const { destination, origin } = route.params;
//   const { user } = useAuth();
//   const [price, setPrice] = useState(7000);

//   const handleBook = () => {
//     alert('Pesanan berhasil dibuat!');
//     navigation.navigate('History');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={styles.backText}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>Pemesanan</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       {/* Maps Rute */}
//       <MapViewWithRoute
//         origin={{
//           latitude: origin.latitude,
//           longitude: origin.longitude,
//         }}
//         destination={{
//           latitude: destination.latitude,
//           longitude: destination.longitude,
//           name: destination.name
//         }}
//       />

//       {/* Detail Pesanan */}
//       <View style={styles.detailContainer}>
//         <Text style={styles.sectionTitle}>Berikut detail pemesanan mu</Text>

//         <View style={styles.detailRow}>
//           <Text style={styles.label}>Posisi sudah benar ga:</Text>
//           <Text style={styles.value}>✅ Ya</Text>
//         </View>

//         <View style={styles.detailRow}>
//           <Text style={styles.label}>Lokasi tujuan:</Text>
//           <Text style={styles.value}>{destination.name}</Text>
//         </View>

//         <View style={styles.detailRow}>
//           <Text style={styles.label}>Alamat Rumah:</Text>
//           <Text style={styles.value}>{origin.address}</Text>
//         </View>

//         <View style={styles.detailRow}>
//           <Text style={styles.label}>Harga:</Text>
//           <Text style={styles.price}>Rp. {price.toLocaleString()}</Text>
//         </View>

//         {/* Button Pesan */}
//         <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
//           <Text style={styles.bookButtonText}>Pesan Objek Camp-Cuss</Text>
//         </TouchableOpacity>
//       </View>

//       <BottomNav activeScreen="Home" />
//     </SafeAreaView>
//   );
// };

// export default BookingScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#4E1F1A',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 15,
//     paddingBottom: 10,
//   },
//   backText: {
//     fontSize: 24,
//     color: '#FCEBD7',
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#FCEBD7',
//   },
//   detailContainer: {
//     backgroundColor: '#FCEBD7',
//     marginHorizontal: 20,
//     marginTop: 20,
//     borderRadius: 15,
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#4E1F1A',
//     marginBottom: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 14,
//     color: '#4E1F1A',
//   },
//   value: {
//     fontSize: 14,
//     color: '#4E1F1A',
//     fontWeight: 'bold',
//   },
//   price: {
//     fontSize: 16,
//     color: '#4E1F1A',
//     fontWeight: 'bold',
//   },
//   bookButton: {
//     backgroundColor: '#F9F1E2',
//     paddingVertical: 15,
//     borderRadius: 100,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   bookButtonText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#4E1F1A',
//   },
// });