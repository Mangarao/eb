import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

const Logo = () => {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/app-icon.png')}
        style={styles.logo}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    marginBottom: 8,
  },
  logo: {
    width: 180,
    height: 60,
  },
});

export default Logo;
