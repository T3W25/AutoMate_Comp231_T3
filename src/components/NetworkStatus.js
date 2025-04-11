// src/components/NetworkStatus.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const opacity = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsConnected(online);
      
      // Animate the banner
      Animated.timing(opacity, {
        toValue: online ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity },
        isConnected ? styles.hidden : styles.visible
      ]}
      pointerEvents={isConnected ? 'none' : 'auto'}
    >
      <Text style={styles.text}>
        No Internet Connection
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  hidden: {
    height: 0,
  },
  visible: {
    height: 40,
  },
});

export default NetworkStatus;