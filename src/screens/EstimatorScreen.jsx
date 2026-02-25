import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const EstimatorScreen = () => {
  const [stitchCount, setStitchCount] = useState('');
  const [machineSpeed, setMachineSpeed] = useState(800);
  const [pricePerThousand, setPricePerThousand] = useState(50);
  const [setupFee, setSetupFee] = useState('0');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const stitches = parseInt(stitchCount);
    const speed = machineSpeed;
    const priceRate = pricePerThousand;
    const setup = parseFloat(setupFee) || 0;
    
    if (!stitches || stitches <= 0) {
      setResult({error: 'Please enter valid stitch count'});
      return;
    }

    // Calculate time
    const timeInMinutes = stitches / speed;
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);
    const timeFormatted = hours > 0 
      ? `${hours}h ${minutes}m ${seconds}s` 
      : minutes > 0 
        ? `${minutes}m ${seconds}s` 
        : `${seconds}s`;

    // Calculate price
    const stitchPrice = (stitches / 10000) * priceRate;
    const totalPrice = stitchPrice + setup;

    setResult({
      stitches,
      speed,
      priceRate,
      setupFee: setup,
      // Time data
      totalMinutes: timeInMinutes.toFixed(2),
      hours,
      minutes,
      seconds,
      timeFormatted,
      // Price data
      thousands: (stitches / 1000).toFixed(2),
      tenThousands: (stitches / 10000).toFixed(2),
      stitchPrice: stitchPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
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
          <View style={styles.headerIcons}>
            <Icon name="timer" size={40} color="#3b82f6" />
            <Icon name="attach-money" size={40} color="#10b981" />
          </View>
          <Text style={styles.title}>Time & Price Estimator</Text>
          <Text style={styles.subtitle}>Calculate embroidery time and cost</Text>
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>TIME SETTINGS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.sliderRow}>
              <Text style={styles.label}>Machine Speed</Text>
              <Text style={styles.sliderValue}>{machineSpeed} st/min</Text>
            </View>
            
            <Slider
              style={styles.slider}
              minimumValue={350}
              maximumValue={1200}
              step={50}
              value={machineSpeed}
              onValueChange={(value) => setMachineSpeed(value)}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#3b82f6"
            />
            
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabel}>350</Text>
              <Text style={styles.rangeLabel}>1200</Text>
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>PRICE SETTINGS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.sliderRow}>
              <Text style={styles.label}>Price per 10,000 Stitches</Text>
              <Text style={[styles.sliderValue, {color: '#10b981'}]}>₹{pricePerThousand}</Text>
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
            <TouchableOpacity style={styles.calculateButton} onPress={calculate}>
              <Icon name="calculate" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.calculateButtonText}>Calculate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resetButton} onPress={reset}>
              <Icon name="refresh" size={20} color="#6366f1" />
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
                  {/* Time Result */}
                  <View style={styles.resultSection}>
                    <View style={styles.resultHeader}>
                      <Icon name="access-time" size={28} color="#3b82f6" />
                      <Text style={styles.resultTitle}>Estimated Time</Text>
                    </View>
                    
                    <View style={[styles.displayBox, {backgroundColor: '#eff6ff'}]}>
                      <Text style={[styles.displayValue, {color: '#3b82f6'}]}>{result.timeFormatted}</Text>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Total Minutes</Text>
                        <Text style={styles.detailValue}>{result.totalMinutes}</Text>
                      </View>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Machine Speed</Text>
                        <Text style={styles.detailValue}>{result.speed} st/min</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Price Result */}
                  <View style={styles.resultSection}>
                    <View style={styles.resultHeader}>
                      <Icon name="account-balance-wallet" size={28} color="#10b981" />
                      <Text style={styles.resultTitle}>Estimated Price</Text>
                    </View>
                    
                    <View style={[styles.displayBox, {backgroundColor: '#ecfdf5'}]}>
                      <Text style={[styles.displayValue, {color: '#10b981'}]}>₹{result.totalPrice}</Text>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Stitch Cost</Text>
                        <Text style={styles.detailValue}>₹{result.stitchPrice}</Text>
                      </View>
                      {result.setupFee > 0 && (
                        <View style={styles.detailColumn}>
                          <Text style={styles.detailLabel}>Setup Fee</Text>
                          <Text style={styles.detailValue}>₹{result.setupFee.toFixed(2)}</Text>
                        </View>
                      )}
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailLabel}>Rate</Text>
                        <Text style={styles.detailValue}>₹{result.priceRate}/10K</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>
                      {result.stitches.toLocaleString()} stitches • {result.thousands}K stitches • {result.timeFormatted}
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
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 12,
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
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  calculateButton: {
    flex: 1,
    backgroundColor: '#6366f1',
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
    backgroundColor: '#eef2ff',
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
  resultSection: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  displayBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  displayValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailColumn: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default EstimatorScreen;
