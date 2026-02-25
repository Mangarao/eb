import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Footer = () => {
  const openAarohiDesigns = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.aarohisewing.aarohidesigns&pcampaignid=web_share';
    Linking.openURL(playStoreUrl).catch(err => console.error('Failed to open Play Store:', err));
  };

  const openWebsite = () => {
    Linking.openURL('https://aarohisewing.com').catch(err => console.error('Failed to open website:', err));
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://aarohisewing.com/embrobuddy-privacy.html').catch(err => console.error('Failed to open privacy policy:', err));
  };

  const callNumber = () => {
    Linking.openURL('tel:6300548691').catch(err => console.error('Failed to make call:', err));
  };

  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <Text style={styles.poweredBy}>Powered by</Text>
        <Text style={styles.companyName}>Aarohi Sewing Enterprises</Text>
        <Text style={styles.tagline}>
          Sewing & Embroidery Machines Store{'\n'}
          Sales | Services | Training | Designs | Software | Material
        </Text>
        
        <View style={styles.contactRow}>
          <TouchableOpacity onPress={openWebsite} style={styles.contactItem}>
            <Icon name="language" size={14} color="#6366f1" />
            <Text style={styles.contactText}>aarohisewing.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={callNumber} style={styles.contactItem}>
            <Icon name="phone" size={14} color="#6366f1" />
            <Text style={styles.contactText}>6300548691</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.designsButton} onPress={openAarohiDesigns}>
          <Icon name="apps" size={16} color="#fff" />
          <Text style={styles.designsButtonText}>Get Aarohi Designs App</Text>
          <Icon name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={openPrivacyPolicy} style={styles.privacyLink}>
          <Text style={styles.privacyText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 12,
  },
  footerContent: {
    padding: 6,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 1,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  tagline: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 11,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '600',
  },
  designsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  designsButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  privacyLink: {
    marginTop: 8,
    paddingVertical: 3,
  },
  privacyText: {
    fontSize: 9,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});

export default Footer;
