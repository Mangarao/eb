import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const PriceEstimatorScreen = () => {
  const [stitchCount, setStitchCount] = useState('');
  const [pricePerThousand, setPricePerThousand] = useState(50); // Default price per 1000 stitches
  const [setupFee, setSetupFee] = useState('0');
  const [result, setResult] = useState(null);

  const calculatePrice = () => {
    const stitches = parseInt(stitchCount);
    const priceRate = pricePerThousand;
    const setup = parseFloat(setupFee) || 0;
    
    if (!stitches || stitches <= 0 || !priceRate || priceRate <= 0) {
      setResult({error: 'Please enter valid stitch count and price rate'});
      return;
    }

    // Calculate price based on per 1000 stitches
    const stitchPrice = (stitches / 1000) * priceRate;
    const totalPrice = stitchPrice + setup;

    setResult({
      stitches,
      priceRate,
      setupFee: setup,
      stitchPrice: stitchPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      thousands: (stitches / 1000).toFixed(2),
    });
  };

  const reset = () => {
    setStitchCount('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView>
        <Logo />
        
        <View style={styles.header}>
          <Icon name="attach-money" size={48} color="#10b981" />
          <Text style={styles.title}>Price Estimator</Text>
          <Text style={styles.subtitle}>Calculate embroidery price based on stitch count</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>Stitch Count</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total stitch count"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={stitchCount}
              onChangeText={setStitchCount}
            />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.priceInputRow}>
              <Text style={styles.label}>Price per 1000 Stitches</Text>
              <Text style={styles.priceValue}>₹{pricePerThousand}</Text>
            </View>
            
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={200}
              step={5}
              value={pricePerThousand}
              onValueChange={(value) => setPricePerThousand(value)}
              minimumTrackTintColor="#10b981"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#10b981"
            />
            
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabel}>₹10</Text>
              <Text style={styles.rangeLabel}>₹200</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Setup/Digitizing Fee (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter setup fee (optional)"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={setupFee}
              onChangeText={setSetupFee}
            />
            <Text style={styles.hint}>One-time fee for new designs</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.calculateButton} onPress={calculatePrice}>
              <Icon name="calculate" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.calculateButtonText}>Calculate Price</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resetButton} onPress={reset}>
              <Icon name="refresh" size={20} color="#10b981" />
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.resultCard}>
              {result.error ? (
                <View style={styles.errorContainer}>
                  <Icon name="error-outline" size={48} color="#ef4444" />
                  <Text style={styles.errorText}>{result.error}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <Icon name="account-balance-wallet" size={32} color="#10b981" />
                    <Text style={styles.resultTitle}>Price Breakdown</Text>
                  </View>
                  
                  <View style={styles.priceDisplay}>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceValue}>₹{result.totalPrice}</Text>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total Stitches</Text>
                      <Text style={styles.detailValue}>{result.stitches.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Thousands</Text>
                      <Text style={styles.detailValue}>{result.thousands}K</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Rate per 1000</Text>
                      <Text style={styles.detailValue}>₹{result.priceRate}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stitch Cost</Text>
                      <Text style={styles.detailValue}>₹{result.stitchPrice}</Text>
                    </View>
                    
                    {result.setupFee > 0 && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Setup Fee</Text>
                        <Text style={styles.detailValue}>₹{result.setupFee.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.calculationBox}>
                    <Text style={styles.calculationTitle}>Calculation:</Text>
                    <Text style={styles.calculationText}>
                      ({result.thousands}K × ₹{result.priceRate})
                      {result.setupFee > 0 && ` + ₹${result.setupFee.toFixed(2)} setup`}
                      {' = '}₹{result.totalPrice}
                    </Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Icon name="info-outline" size={20} color="#10b981" />
                    <Text style={styles.infoText}>
                      Prices may vary based on design complexity, thread colors, and production volume.
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        <Footer />
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  calculateButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  priceDisplay: {
    backgroundColor: '#ecfdf5',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#10b981',
  },
  detailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calculationBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  calculationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  calculationText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  infoBox: {
  priceInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    marginLeft: 8,
  },
});

export default PriceEstimatorScreen;
