import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, Platform, PermissionsAndroid} from 'react-native';
import Slider from '@react-native-community/slider';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import RNShare from 'react-native-share';
import {analyzeFile, exportImage} from '../services/api';
import Footer from '../components/Footer';

const ViewerScreen = ({route, navigation}) => {
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [machineSpeed, setMachineSpeed] = useState(800);
  const [pricePerTenThousand, setPricePerTenThousand] = useState(50);
  
  // Helper function to format error messages
  const formatErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'An unknown error occurred';
    
    // Check for unsupported format errors
    if (errorMsg.toLowerCase().includes('unsupported') || 
        errorMsg.toLowerCase().includes('not supported') ||
        errorMsg.toLowerCase().includes('format may not be supported')) {
      return '\u274c This file format is not supported by the app.\n\n\u2705 Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW';
    }
    
    // Check for corrupted file or unable to process
    if (errorMsg.toLowerCase().includes('corrupted') || 
        errorMsg.toLowerCase().includes('unable to read') ||
        errorMsg.toLowerCase().includes('unable to process')) {
      return '\u274c Unable to process file. The file may be corrupted or in an unsupported format.\n\n\u2705 Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW';
    }
    
    // Check for actual network/connection errors
    if (errorMsg.toLowerCase().includes('unable to connect') ||
        errorMsg.toLowerCase().includes('connection timed out') ||
        errorMsg.toLowerCase().includes('check your internet')) {
      return '\u274c Network error occurred. Please check your internet connection and try again.';
    }
    
    // Check for timeout errors
    if (errorMsg.toLowerCase().includes('timeout') || errorMsg.toLowerCase().includes('timed out')) {
      return '\u274c Request timed out. The file may be too large or server is busy. Please try again.';
    }
    
    // Return original error message
    return errorMsg;
  };
  
  // Handle incoming file from deep link
  useEffect(() => {
    if (route?.params?.fileUri && route?.params?.fromIntent) {
      console.log('Received file from intent:', route.params.fileUri);
      handleFileFromIntent(route.params.fileUri);
      
      // Clear the params to prevent re-processing on navigation
      navigation.setParams({fileUri: null, fromIntent: false});
    }
  }, [route?.params]);

  const handleFileFromIntent = async (uri) => {
    try {
      setError(null);
      setImageUrl(null);
      setLoading(true);
      setImageLoading(true);

      let fileName = 'embroidery_file.dst';
      let fileUri = uri;
      
      try {
        if (uri.startsWith('content://')) {
          console.log('Copying content URI to cache to get filename...');
          // Copy to cache to get the actual file and filename
          const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_temp`;
          await RNFS.copyFile(uri, destPath);
          
          // Now read the directory to find files with extensions
          const cacheFiles = await RNFS.readDir(RNFS.CachesDirectoryPath);
          const copiedFile = cacheFiles.find(f => f.path === destPath);
          
          if (copiedFile) {
            console.log('Copied file:', copiedFile);
            fileUri = 'file://' + copiedFile.path;
            
            // Try to get original filename from the file itself or use a default
            try {
              const stat = await RNFS.stat(uri);
              fileName = stat.originalFilepath?.split('/').pop() || stat.name || 'embroidery_file.dst';
            } catch (e) {
              // Silently use default name - don't log as error since it's expected
              fileName = `shared_file_${Date.now()}.dst`;
            }
          }
          
          console.log('Using filename:', fileName);
        } else {
          fileName = uri.split('/').pop();
        }
      } catch (error) {
        console.log('Using original URI with default filename');
        // Use the original URI and a default name - this is fine
        fileName = `file_${Date.now()}.dst`;
      }
      
      // Create file object compatible with DocumentPicker format
      const file = {
        uri: fileUri,
        name: fileName,
        type: 'application/octet-stream'
      };

      console.log('Analyzing file:', fileName);
      setOriginalFile(file);

      const analysis = await analyzeFile(file, 'viewer');
      console.log('Analysis complete');

      // Only show error if analysis actually failed
      if (analysis.error) {
        setLoading(false);
        setImageLoading(false);
        const formattedError = formatErrorMessage(analysis.error);
        setError(formattedError);
        Alert.alert('Analysis Failed', formattedError);
        return;
      }

      setFileData(analysis);

      if (analysis.preview_url) {
        console.log('Setting preview URL');
        setImageUrl(analysis.preview_url);
      }

      setImageLoading(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setImageLoading(false);
      const errorMsg = formatErrorMessage(err.message || 'Failed to analyze file');
      console.log('File processing failed:', err.message || err);
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };
  
  const pickFile = async () => {
    try {
      setError(null);
      setImageUrl(null);
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      setLoading(true);
      setImageLoading(true);
      setOriginalFile(result[0]);
      
      console.log('Analyzing file:', result[0].name);
      const analysis = await analyzeFile(result[0], 'viewer');
      console.log('Analysis response:', analysis);
      
      setFileData(analysis);
      
      // Set preview image from analysis response
      if (analysis.preview_url) {
        console.log('Setting preview URL:', analysis.preview_url);
        setImageUrl(analysis.preview_url);
      } else {
        console.log('No preview_url in analysis response');
      }
      
      setImageLoading(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setImageLoading(false);
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        console.log('File analysis error:', err.message || err);
        const errorMsg = formatErrorMessage(err.message || 'Failed to analyze file');
        setError(errorMsg);
        Alert.alert('Analysis Failed', errorMsg);
      }
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    
    if (Platform.Version >= 33) {
      // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to save files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Download the original embroidery file to Downloads
  const handleDownloadOriginalFile = async () => {
    if (!originalFile || !originalFile.uri) {
      Alert.alert('Error', 'No file available to download');
      return;
    }
    try {
      const fileName = originalFile.name || `embroidery_${Date.now()}.dst`;
      const dirs = RNBlobUtil.fs.dirs;
      
      console.log('Starting file download...');
      console.log('Original URI:', originalFile.uri);
      console.log('File name:', fileName);
      
      let filePath = originalFile.uri.replace('file://', '');
      
      // If content://, copy to cache first
      if (originalFile.uri.startsWith('content://')) {
        console.log('Content URI detected, copying to cache first...');
        const cachePath = `${dirs.CacheDir}/${fileName}`;
        
        try {
          await RNFS.copyFile(originalFile.uri, cachePath);
          console.log('File copied to cache:', cachePath);
          filePath = cachePath;
        } catch (copyError) {
          console.error('Error copying to cache:', copyError);
          // Try using RNBlobUtil instead
          const stat = await RNBlobUtil.fs.stat(originalFile.uri);
          filePath = stat.path;
          console.log('Using stat path:', filePath);
        }
      }
      
      if (Platform.OS === 'android') {
        console.log('Saving file to Downloads with path:', filePath);
        
        // Check if file exists
        const fileExists = await RNBlobUtil.fs.exists(filePath);
        console.log('File exists:', fileExists);
        
        if (!fileExists) {
          throw new Error('Source file not found at: ' + filePath);
        }
        
        // Use MediaStore to save to Downloads (Android 10+)
        const result = await RNBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: '',
            mimeType: 'application/octet-stream',
          },
          'Download',
          filePath
        );
        
        console.log('File saved to MediaStore:', result);
        Alert.alert('Success', `File saved to Downloads!\n${fileName}`);
        
        // Clean up cache if we created one
        if (originalFile.uri.startsWith('content://')) {
          await RNBlobUtil.fs.unlink(filePath).catch(() => {});
        }
      } else {
        // iOS
        const downloadPath = `${dirs.DocumentDir}/${fileName}`;
        await RNFS.copyFile(filePath, downloadPath);
        Alert.alert('Success', `File saved!\n${fileName}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  };

  // Share the original embroidery file
  const handleShareOriginalFile = async () => {
    if (!originalFile || !originalFile.uri) {
      Alert.alert('Error', 'No file available to share');
      return;
    }
    try {
      const fileName = originalFile.name || `embroidery_${Date.now()}`;
      const dirs = RNBlobUtil.fs.dirs;
      let filePath = originalFile.uri.replace('file://', '');
      
      // If content://, copy to cache first
      if (originalFile.uri.startsWith('content://')) {
        const cachePath = `${dirs.CacheDir}/${fileName}`;
        await RNFS.copyFile(originalFile.uri, cachePath);
        filePath = cachePath;
      }
      
      // Share using react-native-share
      const shareOptions = {
        title: 'Share Embroidery File',
        message: `Share ${fileName}`,
        url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
        type: 'application/octet-stream',
        failOnCancel: false,
      };
      
      await RNShare.open(shareOptions);
      
      console.log('File shared successfully');
      
    } catch (error) {
      console.error('Share error:', error);
      if (error.message && error.message !== 'User did not share') {
        Alert.alert('Error', `Share failed: ${error.message}`);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) {
      Alert.alert('Error', 'No image available to download');
      return;
    }

    try {
      // Use original filename if available, otherwise fallback
      let fileName = 'embroidery.png';
      if (originalFile && originalFile.name) {
        // Replace extension with .png
        const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
        fileName = `${baseName}.png`;
      }
      
      // Extract base64 data
      let base64Data;
      if (imageUrl.startsWith('data:image')) {
        base64Data = imageUrl.split(',')[1];
      } else {
        Alert.alert('Error', 'Invalid image format');
        return;
      }
      
      // Create file in app's cache first
      const dirs = RNBlobUtil.fs.dirs;
      const cachePath = `${dirs.CacheDir}/${fileName}`;
      
      console.log('Creating cache file:', cachePath);
      await RNBlobUtil.fs.writeFile(cachePath, base64Data, 'base64');
      console.log('Cache file created successfully');
      
      if (Platform.OS === 'android') {
        console.log('Saving to Downloads with MediaStore...');
        
        // Copy to MediaStore Downloads
        const result = await RNBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: '',
            mimeType: 'image/png',
          },
          'Download',
          cachePath
        );
        
        console.log('MediaStore result:', result);
        
        // Clean up cache file
        await RNBlobUtil.fs.unlink(cachePath).catch(err => console.log('Cache cleanup error:', err));
        
        Alert.alert('Success', `Image saved to Downloads!\n${fileName}`);
      } else {
        // iOS
        const downloadPath = `${dirs.DocumentDir}/${fileName}`;
        await RNBlobUtil.fs.mv(cachePath, downloadPath);
        Alert.alert('Success', `Image saved!\n${fileName}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  };

  const handleShareImage = async () => {
    if (!imageUrl) {
      Alert.alert('Error', 'No image available to share');
      return;
    }

    try {
      const timestamp = Date.now();
      const fileName = `embroidery_${timestamp}.png`;
      
      // Extract base64 data
      let base64Data;
      if (imageUrl.startsWith('data:image')) {
        base64Data = imageUrl.split(',')[1];
      } else {
        Alert.alert('Error', 'Invalid image format');
        return;
      }
      
      // Save to cache
      const dirs = RNBlobUtil.fs.dirs;
      const cachePath = `${dirs.CacheDir}/${fileName}`;
      
      console.log('Creating cache file for share:', cachePath);
      
      // Write the file
      await RNBlobUtil.fs.writeFile(cachePath, base64Data, 'base64');
      
      // Share using react-native-share
      const shareOptions = {
        title: 'Share Embroidery Image',
        message: 'Check out this embroidery preview',
        url: Platform.OS === 'android' ? `file://${cachePath}` : cachePath,
        type: 'image/png',
        failOnCancel: false,
      };
      
      await RNShare.open(shareOptions);
      
      console.log('Share dialog opened');
      
      // Clean up cache file after a delay
      setTimeout(async () => {
        try {
          await RNBlobUtil.fs.unlink(cachePath);
        } catch (e) {
          console.log('Cache cleanup error:', e);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Share error:', error);
      if (error.message && error.message !== 'User did not share') {
        Alert.alert('Error', `Share failed: ${error.message}`);
      }
    }
  };

  const mmToInches = (mm) => {
    return (mm / 25.4).toFixed(2);
  };

  const handleClear = () => {
    setFileData(null);
    setOriginalFile(null);
    setImageUrl(null);
    setError(null);
    setMachineSpeed(800);
    setPricePerTenThousand(50);
  };

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.brandingText}>by Aarohi Sewing Enterprises</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickFile} disabled={loading}>
          <Icon name="upload-file" size={24} color="#fff" />
          <Text style={styles.uploadText}>
            {loading ? 'Analyzing...' : 'Select Embroidery File'}
          </Text>
        </TouchableOpacity>
        
        {(fileData || error) && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="clear" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Box - Hide when results are shown */}
      {!fileData && !error && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            📌 Upload DST, JEF, PES or other embroidery files{'\n'}
            ✨ View stitch count, dimensions, colors{'\n'}
            🖼️ Generate and download preview image{'\n'}
            ⏱️ Calculate embroidery time{'\n'}
            💰 Estimate production cost
          </Text>
        </View>
      )}

      {!fileData && !error && (
        <View style={styles.formatsBox}>
        <Text style={styles.formatsTitle}>Supported Formats</Text>
        <View style={styles.formatTags}>
          {['DST', 'JEF', 'PES', 'EXP', 'VP3', 'XXX', 'PEC', 'HUS', 'SEW'].map(format => (
            <View key={format} style={styles.tag}>
              <Text style={styles.tagText}>{format}</Text>
            </View>
          ))}
        </View>
      </View>
      )}

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Analyzing file...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {fileData && !loading && (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={{paddingBottom: 20}}>
          {/* File Name */}
          <View style={styles.fileNameCard}>
            <Icon name="insert-drive-file" size={24} color="#6366f1" />
            <Text style={styles.fileName} numberOfLines={2}>
              {originalFile?.name || 'Embroidery File'}
            </Text>
          </View>

          {imageUrl && (
            <View style={styles.imageCard}>
              <Image
                source={{uri: imageUrl}}
                style={styles.previewImage}
                resizeMode="contain"
              />
              {imageLoading && (
                <View style={styles.imageLoader}>
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDownloadImage}
                >
                  <Icon name="download" size={24} color="#6366f1" />
                  <Text style={styles.actionButtonText}>Download Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShareImage}
                >
                  <Icon name="share" size={24} color="#6366f1" />
                  <Text style={styles.actionButtonText}>Share Image</Text>
                </TouchableOpacity>

                {/* New: Download/Share original file */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDownloadOriginalFile}
                >
                  <Icon name="file-download" size={24} color="#10b981" />
                  <Text style={styles.actionButtonText}>Download File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShareOriginalFile}
                >
                  <Icon name="ios-share" size={24} color="#10b981" />
                  <Text style={styles.actionButtonText}>Share File</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {imageLoading && !imageUrl && (
            <View style={styles.imageCard}>
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.placeholderText}>Generating preview...</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Embroidery Details</Text>
            <InfoRow label="Format" value={fileData.format?.toUpperCase() || 'Unknown'} />
            <InfoRow
              label="Stitches"
              value={fileData.stitch_count?.toLocaleString() || '0'}
              icon="straighten"
            />
            <InfoRow
              label="Colors"
              value={fileData.color_count || '0'}
              icon="palette"
            />
            <InfoRow
              label="Trims"
              value={fileData.trim_count || '0'}
              icon="content-cut"
            />

            <View style={styles.dimensionsSection}>
              <Text style={styles.dimensionsTitle}>Dimensions</Text>
              <InfoRow
                label="Width"
                value={`${fileData.width || 0} mm (${mmToInches(fileData.width || 0)}\")`}
              />
              <InfoRow
                label="Height"
                value={`${fileData.height || 0} mm (${mmToInches(fileData.height || 0)}\")`}
              />
            </View>

            <View style={styles.disclaimerBox}>
              <Icon name="info-outline" size={18} color="#f59e0b" />
              <Text style={styles.disclaimerText}>
                Note: Stitch count may vary slightly based on the software or file format used for analysis.
              </Text>
            </View>
          </View>

          {/* Stitch Time Estimation */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Stitch Time Estimation</Text>
            <View style={styles.timeEstimationContainer}>
              <View style={styles.speedInputRow}>
                <Text style={styles.speedLabel}>Machine Speed</Text>
                <Text style={styles.speedValue}>{machineSpeed} stitches/min</Text>
              </View>
              
              <Slider
                style={styles.slider}
                minimumValue={350}
                maximumValue={1200}
                step={50}
                value={machineSpeed}
                onValueChange={(value) => setMachineSpeed(value)}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#6366f1"
              />
              
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>350</Text>
                <Text style={styles.rangeLabel}>1200</Text>
              </View>

              <View style={styles.estimatedTimeContainer}>
                <Icon name="schedule" size={24} color="#6366f1" />
                <View>
                  <Text style={styles.estimatedTimeLabel}>Estimated Time</Text>
                  <Text style={styles.estimatedTimeValue}>
                    {(() => {
                      const speed = machineSpeed || 800;
                      const totalMinutes = (fileData.stitch_count || 0) / speed;
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = Math.floor(totalMinutes % 60);
                      if (hours > 0) {
                        return `${hours}h ${minutes}m`;
                      } else {
                        return `${minutes}m`;
                      }
                    })()}
                  </Text>
                </View>
              </View>

              <Text style={styles.timeNote}>
                * Based on {fileData.stitch_count?.toLocaleString()} stitches at {machineSpeed} stitches/min
              </Text>
            </View>
          </View>

          {/* Price Estimation */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Price Estimation</Text>
            <View style={styles.timeEstimationContainer}>
              <View style={styles.speedInputRow}>
                <Text style={styles.speedLabel}>Price per 10,000 stitches</Text>
                <Text style={styles.speedValue}>₹{pricePerTenThousand}</Text>
              </View>
              
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={500}
                step={10}
                value={pricePerTenThousand}
                onValueChange={(value) => setPricePerTenThousand(value)}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#10b981"
              />
              
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>₹50</Text>
                <Text style={styles.rangeLabel}>₹500</Text>
              </View>

              <View style={styles.estimatedPriceContainer}>
                <Icon name="currency-rupee" size={24} color="#10b981" />
                <View>
                  <Text style={styles.estimatedTimeLabel}>Estimated Price</Text>
                  <Text style={styles.estimatedPriceValue}>
                    ₹{(() => {
                      const stitches = fileData.stitch_count || 0;
                      const calculatedPrice = (stitches / 10000) * pricePerTenThousand;
                      const finalPrice = Math.max(50, calculatedPrice);
                      return finalPrice.toFixed(2);
                    })()}
                  </Text>
                </View>
              </View>

              <Text style={styles.timeNote}>
                * Based on {fileData.stitch_count?.toLocaleString()} stitches at ₹{pricePerTenThousand} per 10,000 stitches (Minimum ₹50)
              </Text>
              
              <View style={styles.disclaimerBox}>
                <Icon name="info-outline" size={18} color="#f59e0b" />
                <Text style={styles.disclaimerText}>
                  Note: The estimated price is not fixed and may vary based on market conditions, location, design complexity, and other factors. This is only an approximate estimation.
                </Text>
              </View>
            </View>
          </View>

          <Footer />
        </ScrollView>
      )}

      {!fileData && !loading && !error && (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Icon name="folder-open" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No file selected</Text>
            <Text style={styles.emptySubtext}>Tap the button above to select a file</Text>
          </View>
          <Footer />
        </ScrollView>
      )}
    </View>
  );
};

const InfoRow = ({label, value, icon}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      {icon && <Icon name={icon} size={18} color="#6b7280" style={styles.infoIcon} />}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  branding: {
    backgroundColor: '#1e40af',
    paddingVertical: 8,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 11,
    color: '#bfdbfe',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  formatsBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  fileNameCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dimensionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  dimensionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#ffffff',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  imagePlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  colorsScroll: {
    marginTop: 8,
  },
  colorItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  colorName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  colorBrand: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  colorText: {
    fontSize: 14,
    color: '#374151',
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  timeEstimationContainer: {
    marginTop: 8,
  },
  speedInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  speedLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  speedValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  estimatedTimeLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  estimatedTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
  },
  estimatedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  estimatedPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  timeNote: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});

export default ViewerScreen;





