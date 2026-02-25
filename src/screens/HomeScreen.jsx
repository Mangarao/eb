import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const HomeScreen = ({navigation}) => {
  const openAarohiDesigns = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.aarohisewing.aarohidesigns&pcampaignid=web_share';
    Linking.openURL(playStoreUrl).catch(err => console.error('Failed to open Play Store:', err));
  };

  const openEmbroideryMachines = () => {
    const machinesUrl = 'https://aarohisewing.com/machines';
    Linking.openURL(machinesUrl).catch(err => console.error('Failed to open Embroidery Machines:', err));
  };

  const openTipsTricks = () => {
    const tipsUrl = 'https://aarohisewing.com/tips-tricks';
    Linking.openURL(tipsUrl).catch(err => console.error('Failed to open Tips & Tricks:', err));
  };

  const openTrainingCenter = () => {
    const trainingUrl = 'https://aarohisewing.com/embroidery-training-center';
    Linking.openURL(trainingUrl).catch(err => console.error('Failed to open Training Center:', err));
  };

  const openVideoCourses = () => {
    const coursesUrl = 'https://aarohisewing.com/courses';
    Linking.openURL(coursesUrl).catch(err => console.error('Failed to open Video Courses:', err));
  };

  const openEmbroideryMaterials = () => {
    const whatsappUrl = 'https://wa.me/916300548691?text=Hi, I am interested in embroidery materials';
    Linking.openURL(whatsappUrl).catch(err => console.error('Failed to open WhatsApp:', err));
  };

  const openCustomDesign = () => {
    const whatsappUrl = 'https://wa.me/919100949956?text=Hi, I am interested in custom embroidery design';
    Linking.openURL(whatsappUrl).catch(err => console.error('Failed to open WhatsApp:', err));
  };

  const features = [
    {
      title: 'File Viewer',
      description: 'View DST, JEF, PES and other embroidery formats',
      icon: 'visibility',
      screen: 'Viewer',
      color: '#3b82f6',
    },
    {
      title: 'Batch Analyzer',
      description: 'Analyze multiple files at once',
      icon: 'analytics',
      screen: 'Batch',
      color: '#8b5cf6',
    },
    {
      title: 'Format Converter',
      description: 'Convert between DST, JEF, PES formats',
      icon: 'transform',
      screen: 'Converter',
      color: '#10b981',
    },
    {
      title: 'ZIP Extractor',
      description: 'Extract and analyze ZIP archives',
      icon: 'folder-zip',
      screen: 'ZIP',
      color: '#f59e0b',
    },
    {
      title: 'Time & Price Estimator',
      description: 'Calculate embroidery time and cost from stitch count',
      icon: 'calculate',
      screen: 'Estimator',
      color: '#06b6d4',
    },
    {
      title: 'Tips & Tricks',
      description: 'Helpful embroidery tips and techniques',
      icon: 'lightbulb',
      action: openTipsTricks,
      color: '#eab308',
    },
    {
      title: 'Embroidery Designs',
      description: 'Browse 1000+ ready-made embroidery designs',
      icon: 'dashboard',
      action: openAarohiDesigns,
      color: '#ec4899',
    },
    {
      title: 'Embroidery Machines',
      description: 'Explore professional embroidery machines',
      icon: 'precision-manufacturing',
      action: openEmbroideryMachines,
      color: '#8b5cf6',
    },
    {
      title: 'Training',
      description: 'Access embroidery training center and resources',
      icon: 'school',
      action: openTrainingCenter,
      color: '#f97316',
    },
    {
      title: 'Video Courses',
      description: 'Learn embroidery techniques with video tutorials',
      icon: 'play-circle-outline',
      action: openVideoCourses,
      color: '#ef4444',
    },
    {
      title: 'Embroidery Materials',
      description: 'Contact us on WhatsApp for materials inquiry',
      icon: 'request-quote',
      action: openEmbroideryMaterials,
      color: '#10b981',
    },
    {
      title: 'Custom Logo & Photo Design Customization',
      description: 'Contact us on WhatsApp for customization',
      icon: 'design-services',
      action: openCustomDesign,
      color: '#06b6d4',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Logo />
      <View style={styles.header}>
        <Text style={styles.title}>Embro Buddy</Text>
        <Text style={styles.subtitle}>Your Embroidery File Management Tool</Text>
      </View>

      <View style={styles.features}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, {borderLeftColor: feature.color}]}
            onPress={() => feature.action ? feature.action() : navigation.navigate(feature.screen)}>
            <View style={[styles.iconContainer, {backgroundColor: feature.color}]}>
              <Icon name={feature.icon} size={32} color="#fff" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Supported Formats</Text>
        <View style={styles.formatTags}>
          {['DST', 'JEF', 'PES', 'EXP', 'VP3', 'XXX', 'PEC', 'HUS', 'SEW'].map(format => (
            <View key={format} style={styles.tag}>
              <Text style={styles.tagText}>{format}</Text>
            </View>
          ))}
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  features: {
    padding: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  info: {
    padding: 24,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  formatTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
});

export default HomeScreen;
