import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform, PermissionsAndroid} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNBlobUtil from 'react-native-blob-util';
import RNShare from 'react-native-share';
import {convertFormat} from '../services/api';
import Footer from '../components/Footer';

const ConverterScreen = () => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('DST');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Helper function to format error messages
  const formatErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'An unknown error occurred';
    
    // Check for unsupported format errors
    if (errorMsg.toLowerCase().includes('unsupported') || 
        errorMsg.toLowerCase().includes('not supported') ||
        errorMsg.toLowerCase().includes('format may not be supported')) {
      return '❌ This file format is not supported by the app.\n\n✅ Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW';
    }
    
    // Check for corrupted file or unable to process
    if (errorMsg.toLowerCase().includes('corrupted') || 
        errorMsg.toLowerCase().includes('unable to read') ||
        errorMsg.toLowerCase().includes('unable to process')) {
      return '\u274c Unable to process file. The file may be corrupted or in an unsupported format.\n\n✅ Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW';
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

  const formats = ['DST', 'JEF', 'PES', 'EXP', 'VP3'];

  const pickFile = async () => {
    try {
      setError(null);
      const file = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setSelectedFile(file[0]);
      setResult(null);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setError(err.message);
      }
    }
  };

  const convertFile = async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Starting conversion to:', targetFormat);
      const converted = await convertFormat(selectedFile, targetFormat);
      console.log('Conversion result:', converted);
      
      // Check if conversion returned an error
      if (converted.error) {
        throw new Error(converted.error);
      }
      
      setResult(converted);
      setLoading(false);
      
      // Show success popup
      Alert.alert(
        'Conversion Successful!',
        `File has been converted to ${targetFormat} format successfully.`,
        [{text: 'OK'}]
      );
    } catch (err) {
      setLoading(false);
      console.error('Conversion error details:', err);
      let errorMessage = formatErrorMessage(err.message || 'Conversion failed. Please try again.');
      
      // Check for specific backend errors
      if (errorMessage.includes('Usage:') || errorMessage.includes('command')) {
        errorMessage = 'Server configuration error. Please contact support.';
      }
      
      setError(errorMessage);
      Alert.alert('Conversion Failed', errorMessage);
    }
  };

  const handleDownloadFile = async () => {
    console.log('Download clicked, result:', result);
    
    if (!result) {
      Alert.alert('Error', 'No converted file available');
      return;
    }

    try {
      // Use original filename with new extension
      let fileName = `converted_${Date.now()}.${targetFormat.toLowerCase()}`;
      if (selectedFile && selectedFile.name) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
        fileName = `${baseName}.${targetFormat.toLowerCase()}`;
      }
      
      // Check if file is already downloaded to localPath
      if (result.localPath) {
        console.log('File already at localPath:', result.localPath);
        
        // Verify file exists
        const exists = await RNBlobUtil.fs.exists(result.localPath);
        if (exists) {
          // Copy with correct filename
          const dirs = RNBlobUtil.fs.dirs;
          const cachePath = `${dirs.CacheDir}/${fileName}`;
          
          // Copy to cache first
          await RNBlobUtil.fs.cp(result.localPath, cachePath);
          
          if (Platform.OS === 'android') {
            // Copy to MediaStore Downloads with correct filename
            const mediaUri = await RNBlobUtil.MediaCollection.copyToMediaStore(
              {
                name: fileName,
                parentFolder: '',
                mimeType: 'application/octet-stream',
              },
              'Download',
              cachePath
            );
            
            console.log('File saved to Downloads via MediaStore:', mediaUri);
            
            // Clean up cache
            await RNBlobUtil.fs.unlink(cachePath).catch(() => {});
            
            Alert.alert('Success', `File saved to Downloads!\n${fileName}`);
          } else {
            // iOS
            const downloadPath = `${dirs.DocumentDir}/${fileName}`;
            await RNBlobUtil.fs.cp(cachePath, downloadPath);
            await RNBlobUtil.fs.unlink(cachePath).catch(() => {});
            Alert.alert('Success', `File saved!\n${fileName}`);
          }
          return;
        } else {
          console.log('File does not exist at localPath, will re-download');
        }
      }
      
      // Download from URL if available
      if (result.download_url) {
        const dirs = RNBlobUtil.fs.dirs;
        
        console.log('Downloading from URL:', result.download_url);
        
        if (Platform.OS === 'android') {
          // Download to cache first, then use MediaStore for Android 10+
          const cachePath = `${dirs.CacheDir}/${fileName}`;
          
          const response = await RNBlobUtil.config({
            path: cachePath,
            fileCache: true,
          }).fetch('GET', result.download_url);
          
          console.log('File downloaded to cache:', response.path());
          
          // Copy to MediaStore Downloads
          const mediaUri = await RNBlobUtil.MediaCollection.copyToMediaStore(
            {
              name: fileName,
              parentFolder: '',
              mimeType: 'application/octet-stream',
            },
            'Download',
            response.path()
          );
          
          console.log('File saved to Downloads via MediaStore:', mediaUri);
          
          // Clean up cache
          await RNBlobUtil.fs.unlink(response.path()).catch(() => {});
          
          Alert.alert('Success', `File saved to Downloads!\n${fileName}`);
        } else {
          // iOS
          const downloadPath = `${dirs.DocumentDir}/${fileName}`;
          
          const response = await RNBlobUtil.config({
            path: downloadPath,
            fileCache: true,
          }).fetch('GET', result.download_url);
          
          console.log('File downloaded:', response.path());
          Alert.alert('Success', `File saved!\n${fileName}`);
        }
        return;
      }
      
      // No valid source for file
      console.error('No localPath or download_url in result:', result);
      Alert.alert('Error', 'No download source available. Please try converting again.');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  };

  const handleShareFile = async () => {
    console.log('Share clicked, result:', result);
    
    if (!result) {
      Alert.alert('Error', 'No converted file available to share');
      return;
    }

    try {
      // Use original filename with new extension
      let fileName = `converted_${Date.now()}.${targetFormat.toLowerCase()}`;
      if (selectedFile && selectedFile.name) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
        fileName = `${baseName}.${targetFormat.toLowerCase()}`;
      }
      
      let filePath = result.localPath;
      const dirs = RNBlobUtil.fs.dirs;
      const shareFilePath = `${dirs.CacheDir}/${fileName}`;
      
      // Always copy to cache with proper filename before sharing
      if (filePath && await RNBlobUtil.fs.exists(filePath)) {
        console.log('Copying file to cache for sharing:', filePath, '->', shareFilePath);
        await RNBlobUtil.fs.cp(filePath, shareFilePath);
        console.log('File copied to cache successfully');
      } else if (result.download_url) {
        console.log('Downloading file for share from:', result.download_url);
        
        const response = await RNBlobUtil.config({
          path: shareFilePath,
          fileCache: true,
        }).fetch('GET', result.download_url);
        
        console.log('File downloaded to cache:', response.path());
      } else {
        console.error('No localPath or download_url in result:', result);
        Alert.alert('Error', 'No file available to share. Please try converting again.');
        return;
      }
      
      // Share from cache
      console.log('Sharing file from cache:', shareFilePath);
      
      const shareOptions = {
        title: 'Share Converted File',
        message: `Share ${fileName}`,
        url: `file://${shareFilePath}`,
        type: 'application/octet-stream',
        failOnCancel: false,
      };
      
      await RNShare.open(shareOptions);
      console.log('Share dialog opened');
      
      // Clean up cache after a delay
      setTimeout(async () => {
        try {
          await RNBlobUtil.fs.unlink(shareFilePath);
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

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setTargetFormat('DST');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
          <Icon name="upload-file" size={24} color="#fff" />
          <Text style={styles.uploadText}>Select File to Convert</Text>
        </TouchableOpacity>
        
        {(selectedFile || result || error) && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="clear" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Box - Hide when file is selected or converted */}
      {!selectedFile && !result && !error && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            🔄 Convert embroidery files between formats{'\n'}
            📁 Supports DST, JEF, PES, EXP, VP3 formats
          </Text>
        </View>
      )}

      {selectedFile && (
        <View style={styles.fileCard}>
          <Icon name="insert-drive-file" size={32} color="#10b981" />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {(selectedFile.size / 1024).toFixed(2)} KB
            </Text>
          </View>
        </View>
      )}

      {selectedFile && (
        <View style={styles.formatSection}>
          <Text style={styles.sectionTitle}>Convert to:</Text>
          <View style={styles.formatGrid}>
            {formats.map(format => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatButton,
                  targetFormat === format && styles.formatButtonActive,
                ]}
                onPress={() => setTargetFormat(format)}>
                <Text
                  style={[
                    styles.formatText,
                    targetFormat === format && styles.formatTextActive,
                  ]}>
                  {format}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.convertButton}
            onPress={convertFile}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="transform" size={24} color="#fff" />
                <Text style={styles.convertText}>Convert to {targetFormat}</Text>
              </>
            )}
          </TouchableOpacity>

          {!result && (
            <View style={styles.disclaimerBox}>
              <Icon name="info-outline" size={18} color="#f59e0b" />
              <Text style={styles.disclaimerText}>
                Important: Converted files may not work in all machines or software. Please test the converted file before use. We are not responsible for any design issues or compatibility problems that may occur after conversion.
              </Text>
            </View>
          )}
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownloadFile}
            >
              <Icon name="download" size={24} color="#10b981" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareFile}
            >
              <Icon name="share" size={24} color="#10b981" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>📊 File Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format:</Text>
              <Text style={styles.detailValue}>{targetFormat}</Text>
            </View>
            
            {result.stitch_count && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stitches:</Text>
                <Text style={styles.detailValue}>{result.stitch_count.toLocaleString()}</Text>
              </View>
            )}
            
            {result.color_count && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Colors:</Text>
                <Text style={styles.detailValue}>{result.color_count}</Text>
              </View>
            )}
            
            {result.width && result.height && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dimensions:</Text>
                  <Text style={styles.detailValue}>
                    {result.width} × {result.height} mm
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}></Text>
                  <Text style={styles.detailValue}>
                    {(result.width / 25.4).toFixed(2)} × {(result.height / 25.4).toFixed(2)} in
                  </Text>
                </View>
              </>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {selectedFile && selectedFile.name 
                  ? `${selectedFile.name.replace(/\.[^/.]+$/, '')}.${targetFormat.toLowerCase()}`
                  : result.filename}
              </Text>
            </View>
            
            {result.size && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Size:</Text>
                <Text style={styles.detailValue}>
                  {(result.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.resultInfo}>✓ File ready for download or share</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!selectedFile && !error && (
        <View style={styles.emptyState}>
          <Icon name="compare-arrows" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No file selected</Text>
          <Text style={styles.emptySubtext}>Choose a file to convert between formats</Text>
        </View>
      )}

      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  buttonRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#10b981',
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
    backgroundColor: '#d1fae5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#065f46',
    lineHeight: 20,
  },
  fileCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  formatSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  formatButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  formatButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  formatTextActive: {
    color: '#6366f1',
  },
  convertButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  convertText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 12,
  },
  detailsSection: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  resultInfo: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
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
    color: '#10b981',
  },
  resultPath: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
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

export default ConverterScreen;
