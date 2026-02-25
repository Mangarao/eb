import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const StitchTimeEstimatorScreen = () => {
  const [stitchCount, setStitchCount] = useState('');
  const [result, setResult] = useState(null);
  const [machineSpeed, setMachineSpeed] = useState(800); // Default stitches per minute

  const calculateTime = () => {
    const stitches = parseInt(stitchCount);
    const speed = machineSpeed;
    
    if (!stitches || stitches <= 0 || !speed || speed <= 0) {
      setResult({error: 'Please enter valid stitch count and machine speed'});
      return;
    }

    // Calculate time in minutes
    const timeInMinutes = stitches / speed;
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes % 60);
    const seconds = Math.floor((timeInMinutes * 60) % 60);

    setResult({
      stitches,
      speed,
      totalMinutes: timeInMinutes.toFixed(2),
      hours,
      minutes,
      seconds,
      formatted: hours > 0 
        ? `${hours}h ${minutes}m ${seconds}s` 
        : minutes > 0 
          ? `${minutes}m ${seconds}s` 
          : `${seconds}s`,
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
          <Icon name="timer" size={48} color="#3b82f6" />
          <Text style={styles.title}>Stitch Time Estimator</Text>
          <Text style={styles.subtitle}>Calculate embroidery time based on stitch count</Text>
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
            <View style={styles.speedInputRow}>
              <Text style={styles.label}>Machine Speed</Text>
              <Text style={styles.speedValue}>{machineSpeed} stitches/min</Text>
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.calculateButton} onPress={calculateTime}>
              <Icon name="calculate" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.calculateButtonText}>Calculate Time</Text>
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
                  <View style={styles.resultHeader}>
                    <Icon name="access-time" size={32} color="#3b82f6" />
                    <Text style={styles.resultTitle}>Estimated Time</Text>
                  </View>
                  
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeValue}>{result.formatted}</Text>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total Stitches</Text>
                      <Text style={styles.detailValue}>{result.stitches.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Machine Speed</Text>
                      <Text style={styles.detailValue}>{result.speed} st/min</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total Minutes</Text>
                      <Text style={styles.detailValue}>{result.totalMinutes}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Breakdown</Text>
                      <Text style={styles.detailValue}>
                        {result.hours}h {result.minutes}m {result.seconds}s
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Icon name="info-outline" size={20} color="#6366f1" />
                    <Text style={styles.infoText}>
                      This is an estimate. Actual time may vary based on design complexity and machine setup.
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
    backgroundColor: '#3b82f6',
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
  timeDisplay: {
    backgroundColor: '#eff6ff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
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
  infoBox: {
    flexDirection: 'row',
  speedInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speedValue: {
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
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6366f1',
    marginLeft: 8,
  },
});

export default StitchTimeEstimatorScreen;
