// // src/components/MapViewWithRoute.js
// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Alert } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';

// const OPENROUTESERVICE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE4M2RmMzcwOThiOTRmZmY4N2VjODBlYzM3OTBjMjA3IiwiaCI6Im11cm11cjY0In0=';

// const MapViewWithRoute = ({ origin, destination }) => {
//   const [routeCoordinates, setRouteCoordinates] = useState([]);

//   // Hitung rute via OpenRouteService
//   const fetchRoute = async () => {
//     if (!origin || !destination) return;

//     try {
//       // OpenRouteService menerima [lng, lat]
//       const coordinates = [
//         [origin.longitude, origin.latitude],
//         [destination.longitude, destination.latitude],
//       ];

//       const response = await fetch(
//         'https://api.openrouteservice.org/v2/directions/driving-car',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json; charset=utf-8',
//             Authorization: OPENROUTESERVICE_API_KEY,
//           },
//           body: JSON.stringify({
//             coordinates,
//             instructions: false,
//             geometry_format: 'geojson', // Agar mudah dipakai di React Native Maps
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.error) {
//         throw new Error(data.error.message || 'Gagal menghitung rute');
//       }

//       // Ambil koordinat polyline (format: [[lng, lat], [lng, lat], ...])
//       const coords = data.features[0].geometry.coordinates;

//       // Ubah ke format React Native Maps: [{ latitude, longitude }, ...]
//       const route = coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
//       setRouteCoordinates(route);
//     } catch (err) {
//       console.error('OpenRouteService error:', err);
//       Alert.alert('Error', 'Gagal menghitung rute. Coba lagi nanti.');
//     }
//   };

//   useEffect(() => {
//     fetchRoute();
//   }, [origin, destination]);

//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: (origin?.latitude + destination?.latitude) / 2 || -6.9,
//           longitude: (origin?.longitude + destination?.longitude) / 2 || 107.6,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//       >
//         {/* Marker Lokasi User */}
//         {origin && (
//           <Marker
//             coordinate={origin}
//             title="Lokasi Anda"
//             pinColor="black"
//           />
//         )}

//         {/* Marker Tujuan */}
//         {destination && (
//           <Marker
//             coordinate={destination}
//             title={destination.name || 'Tujuan'}
//             pinColor="red"
//           />
//         )}

//         {/* Garis Rute */}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeColor="#000"
//             strokeWidth={5}
//             lineCap="round"
//             lineJoin="round"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// export default MapViewWithRoute;

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     height: 250,
//     borderRadius: 15,
//     overflow: 'hidden',
//     marginBottom: 20,
//   },
//   map: {
//     flex: 1,
//   },
// });
