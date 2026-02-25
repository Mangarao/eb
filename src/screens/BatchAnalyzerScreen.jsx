import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Image, Platform, Alert} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNBlobUtil from 'react-native-blob-util';
import RNShare from 'react-native-share';
import {analyzeBatch} from '../services/api';
import Footer from '../components/Footer';

const BatchAnalyzerScreen = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedFileIndex, setExpandedFileIndex] = useState(null);

  // Helper function to format error messages
  const formatErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'Analysis failed';
    
    // Check for unsupported format errors
    if (errorMsg.toLowerCase().includes('unsupported') || 
        errorMsg.toLowerCase().includes('not supported') ||
        errorMsg.toLowerCase().includes('format may not be supported')) {
      return '❌ Format not supported. Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW';
    }
    
    // Check for corrupted file or unable to process
    if (errorMsg.toLowerCase().includes('corrupted') || 
        errorMsg.toLowerCase().includes('unable to read') ||
        errorMsg.toLowerCase().includes('unable to process')) {
      return '\u274c Unable to process file. File may be corrupted or unsupported.';
    }
    
    // Check for actual network/connection errors
    if (errorMsg.toLowerCase().includes('unable to connect') ||
        errorMsg.toLowerCase().includes('connection timed out') ||
        errorMsg.toLowerCase().includes('check your internet')) {
      return '\u274c Network error. Please check your internet connection.';
    }
    
    // Check for timeout errors
    if (errorMsg.toLowerCase().includes('timeout') || errorMsg.toLowerCase().includes('timed out')) {
      return '\u274c Request timed out. Please try again.';
    }
    
    // Return original error message
    return errorMsg;
  };

  const pickFiles = async () => {
    try {
      setError(null);
      setResults([]);
      setExpandedFileIndex(null);
      const files = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      if (files.length > 20) {
        setError('Maximum 20 files allowed');
        return;
      }
      
      setLoading(true);
      setProgress({ current: 0, total: files.length });
      
      const analysisResults = await analyzeBatch(files);
      
      // Store results with original file references
      const resultsWithFiles = analysisResults.map((result, index) => ({
        ...result,
        originalFile: files[index], // Add original file reference
      }));
      
      console.log('Analysis results:', resultsWithFiles);
      setResults(resultsWithFiles);
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    } catch (err) {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        console.error('Batch analysis error:', err);
        const formattedError = formatErrorMessage(err.message || 'Failed to analyze files');
        setError(formattedError);
      }
    }
  };

  const toggleFileDetails = (index) => {
    setExpandedFileIndex(expandedFileIndex === index ? null : index);
  };

  const handleClear = () => {
    setResults([]);
    setError(null);
    setExpandedFileIndex(null);
  };

  const handleDownloadImage = async (item) => {
    try {
      if (!item.preview_url) {
        Alert.alert('Error', 'No preview image available');
        return;
      }

      // Check if it's a base64 data URL
      const isBase64 = item.preview_url.startsWith('data:image');
      const baseName = item.filename.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}.png`;

      if (Platform.OS === 'android') {
        const dirs = RNBlobUtil.fs.dirs;
        const cachePath = `${dirs.CacheDir}/${fileName}`;

        if (isBase64) {
          // Extract base64 data and save directly
          const base64Data = item.preview_url.split(',')[1];
          await RNBlobUtil.fs.writeFile(cachePath, base64Data, 'base64');
          console.log('Base64 image saved to cache:', cachePath);
        } else {
          // Download from URL
          console.log('Downloading image from:', item.preview_url);
          const response = await RNBlobUtil.config({
            path: cachePath,
            fileCache: true,
          }).fetch('GET', item.preview_url);
          console.log('Image downloaded to cache:', response.path());
        }

        const mediaUri = await RNBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: '',
            mimeType: 'image/png',
          },
          'Download',
          cachePath
        );

        console.log('Image saved to Downloads via MediaStore:', mediaUri);
        await RNBlobUtil.fs.unlink(cachePath).catch(() => {});
        Alert.alert('Success', `Image saved to Downloads!\n${fileName}`);
      } else {
        const dirs = RNBlobUtil.fs.dirs;
        const downloadPath = `${dirs.DocumentDir}/${fileName}`;
        
        if (isBase64) {
          const base64Data = item.preview_url.split(',')[1];
          await RNBlobUtil.fs.writeFile(downloadPath, base64Data, 'base64');
        } else {
          const response = await RNBlobUtil.config({
            path: downloadPath,
            fileCache: true,
          }).fetch('GET', item.preview_url);
        }
        Alert.alert('Success', `Image saved!\n${fileName}`);
      }
    } catch (error) {
      console.error('Image download error:', error);
      Alert.alert('Error', `Failed to download image: ${error.message}`);
    }
  };

  const handleShareImage = async (item) => {
    try {
      if (!item.preview_url) {
        Alert.alert('Error', 'No preview image available');
        return;
      }

      const isBase64 = item.preview_url.startsWith('data:image');
      const baseName = item.filename.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}.png`;
      const dirs = RNBlobUtil.fs.dirs;
      const cachePath = `${dirs.CacheDir}/${fileName}`;

      if (isBase64) {
        // Extract base64 data and save to cache
        const base64Data = item.preview_url.split(',')[1];
        await RNBlobUtil.fs.writeFile(cachePath, base64Data, 'base64');
        console.log('Base64 image saved to cache for sharing:', cachePath);
      } else {
        // Download from URL
        console.log('Downloading image for sharing:', item.preview_url);
        const response = await RNBlobUtil.config({
          path: cachePath,
          fileCache: true,
        }).fetch('GET', item.preview_url);
        console.log('Image downloaded to cache:', response.path());
      }

      const shareOptions = {
        title: 'Share Embroidery Preview',
        message: `Preview of ${item.filename}`,
        url: `file://${cachePath}`,
        type: 'image/png',
        failOnCancel: false,
      };

      await RNShare.open(shareOptions);
      console.log('Share dialog opened');

      setTimeout(async () => {
        try {
          await RNBlobUtil.fs.unlink(cachePath);
        } catch (e) {
          console.log('Cache cleanup error:', e);
        }
      }, 5000);
    } catch (error) {
      console.error('Image share error:', error);
      if (error.message && error.message !== 'User did not share') {
        Alert.alert('Error', `Failed to share image: ${error.message}`);
      }
    }
  };

  const handleDownloadFile = async (item) => {
    try {
      if (!item.originalFile || !item.originalFile.uri) {
        Alert.alert('Error', 'No file available to download');
        return;
      }

      const fileName = item.originalFile.name || item.filename;
      const dirs = RNBlobUtil.fs.dirs;
      let filePath = item.originalFile.uri.replace('file://', '');

      // If content://, copy to cache first
      if (item.originalFile.uri.startsWith('content://')) {
        console.log('Content URI detected, copying to cache...');
        const cachePath = `${dirs.CacheDir}/${fileName}`;
        await RNBlobUtil.fs.cp(item.originalFile.uri, cachePath);
        filePath = cachePath;
      }

      if (Platform.OS === 'android') {
        console.log('Saving file to Downloads:', filePath);

        const fileExists = await RNBlobUtil.fs.exists(filePath);
        if (!fileExists) {
          throw new Error('Source file not found');
        }

        const mediaUri = await RNBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: '',
            mimeType: 'application/octet-stream',
          },
          'Download',
          filePath
        );

        console.log('File saved to MediaStore:', mediaUri);
        Alert.alert('Success', `File saved to Downloads!\n${fileName}`);

        // Clean up cache if we created one
        if (item.originalFile.uri.startsWith('content://')) {
          await RNBlobUtil.fs.unlink(filePath).catch(() => {});
        }
      } else {
        // iOS
        const downloadPath = `${dirs.DocumentDir}/${fileName}`;
        await RNBlobUtil.fs.cp(filePath, downloadPath);
        Alert.alert('Success', `File saved!\n${fileName}`);
      }
    } catch (error) {
      console.error('File download error:', error);
      Alert.alert('Error', `Failed to download file: ${error.message}`);
    }
  };

  const handleShareFile = async (item) => {
    try {
      if (!item.originalFile || !item.originalFile.uri) {
        Alert.alert('Error', 'No file available to share');
        return;
      }

      const fileName = item.originalFile.name || item.filename;
      const dirs = RNBlobUtil.fs.dirs;
      let filePath = item.originalFile.uri.replace('file://', '');

      // If content://, copy to cache first
      if (item.originalFile.uri.startsWith('content://')) {
        const cachePath = `${dirs.CacheDir}/${fileName}`;
        await RNBlobUtil.fs.cp(item.originalFile.uri, cachePath);
        filePath = cachePath;
      }

      const shareOptions = {
        title: 'Share Embroidery File',
        message: `Share ${fileName}`,
        url: `file://${filePath}`,
        type: 'application/octet-stream',
        failOnCancel: false,
      };

      await RNShare.open(shareOptions);
      console.log('File shared successfully');

      // Clean up cache after delay
      if (item.originalFile.uri.startsWith('content://')) {
        setTimeout(async () => {
          try {
            await RNBlobUtil.fs.unlink(filePath);
          } catch (e) {
            console.log('Cache cleanup error:', e);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('File share error:', error);
      if (error.message && error.message !== 'User did not share') {
        Alert.alert('Error', `Failed to share file: ${error.message}`);
      }
    }
  };

  const renderItem = ({item, index}) => {
    // Check if this file had an error
    if (item.error) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.fileNumberRow}>
            <View style={[styles.fileNumberBadge, styles.errorBadge]}>
              <Text style={styles.fileNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.fileNameContainer}>
              <Icon name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.fileName} numberOfLines={2}>{item.filename}</Text>
            </View>
          </View>
          <View style={styles.errorMessage}>
            <Text style={styles.errorMessageText}>{formatErrorMessage(item.error_message || 'Analysis failed')}</Text>
          </View>
        </View>
      );
    }
    
    // Convert dimensions from mm to inches (1 inch = 25.4 mm)
    const widthMM = item.width || 0;
    const heightMM = item.height || 0;
    const widthInch = (widthMM / 25.4).toFixed(2);
    const heightInch = (heightMM / 25.4).toFixed(2);
    
    return (
      <View style={styles.resultCard}>
        {/* File Number & Name */}
        <View style={styles.fileNumberRow}>
          <View style={styles.fileNumberBadge}>
            <Text style={styles.fileNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.fileNameContainer}>
            <Icon name="insert-drive-file" size={20} color="#6366f1" />
            <Text style={styles.fileName} numberOfLines={2}>{item.filename}</Text>
          </View>
        </View>

        {/* Format */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Format:</Text>
          <Text style={styles.infoValue}>{item.format || 'Unknown'}</Text>
        </View>

        {/* Dimensions in MM */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Size (mm):</Text>
          <Text style={styles.infoValue}>{widthMM.toFixed(1)} × {heightMM.toFixed(1)} mm</Text>
        </View>

        {/* Dimensions in Inches */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Size (inch):</Text>
          <Text style={styles.infoValue}>{widthInch}" × {heightInch}"</Text>
        </View>

        {/* Stitch Count */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Stitches:</Text>
          <Text style={styles.infoValue}>{(item.stitch_count || 0).toLocaleString()}</Text>
        </View>

        {/* Colors */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Colors:</Text>
          <Text style={styles.infoValue}>{item.color_count || 0}</Text>
        </View>

        {/* View Details Button */}
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => toggleFileDetails(index)}
        >
          <Icon 
            name={expandedFileIndex === index ? 'expand-less' : 'expand-more'} 
            size={20} 
            color="#6366f1" 
          />
          <Text style={styles.viewDetailsText}>
            {expandedFileIndex === index ? 'Hide Details' : 'View Full Details'}
          </Text>
        </TouchableOpacity>

        {/* Expanded Details Section */}
        {expandedFileIndex === index && (
          <View style={styles.expandedSection}>
            {item.preview_url && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Preview</Text>
                <Image
                  source={{uri: item.preview_url}}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                
                {/* Image Action Buttons */}
                <View style={styles.imageActionsRow}>
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={() => handleDownloadImage(item)}
                  >
                    <Icon name="download" size={20} color="#10b981" />
                    <Text style={styles.imageActionText}>Save Image</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={() => handleShareImage(item)}
                  >
                    <Icon name="share" size={20} color="#10b981" />
                    <Text style={styles.imageActionText}>Share Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* File Action Buttons */}
            {item.originalFile && (
              <View style={styles.fileActionsContainer}>
                <Text style={styles.fileActionsTitle}>File Actions</Text>
                <View style={styles.fileActionsRow}>
                  <TouchableOpacity
                    style={styles.fileActionButton}
                    onPress={() => handleDownloadFile(item)}
                  >
                    <Icon name="download" size={20} color="#6366f1" />
                    <Text style={styles.fileActionText}>Download File</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.fileActionButton}
                    onPress={() => handleShareFile(item)}
                  >
                    <Icon name="share" size={20} color="#6366f1" />
                    <Text style={styles.fileActionText}>Share File</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoTitle}>Additional Information</Text>
              
              <View style={styles.detailRow}>
                <Icon name="content-cut" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Trims:</Text>
                <Text style={styles.detailValue}>{item.trim_count || 0}</Text>
              </View>

              {item.stops !== undefined && (
                <View style={styles.detailRow}>
                  <Icon name="stop-circle" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Stops:</Text>
                  <Text style={styles.detailValue}>{item.stops}</Text>
                </View>
              )}

              {item.jumps !== undefined && (
                <View style={styles.detailRow}>
                  <Icon name="arrow-forward" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Jumps:</Text>
                  <Text style={styles.detailValue}>{item.jumps}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };
  
  // Main component render
  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.brandingText}>by Aarohi Sewing Enterprises</Text>
      </View>
      {/* Upload Button */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickFiles} disabled={loading}>
          <Icon name="upload-file" size={24} color="#fff" />
          <Text style={styles.uploadText}>
            {loading ? 'Analyzing...' : 'Select Multiple Files'}
          </Text>
        </TouchableOpacity>
        
        {(results.length > 0 || error) && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="clear" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {!loading && !error && results.length === 0 && (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              📌 Select up to 20 embroidery files{'\n'}
              ✨ View dimensions in mm and inches
            </Text>
          </View>
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
        </>
      )}

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>
            Analyzing files...
            {progress.total > 0 && ` (Processing ${progress.total} files)`}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={pickFiles}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {results.length > 0 && !loading && (
        <View style={styles.resultsWrapper}>
          <View style={styles.summary}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.summaryText}>Analyzed {results.length} file{results.length > 1 ? 's' : ''} successfully</Text>
          </View>
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}

      {results.length === 0 && !loading && !error && (
        <View style={styles.emptyState}>
          <Icon name="layers" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No files analyzed yet</Text>
          <Text style={styles.emptySubtext}>Select multiple embroidery files to view batch analysis</Text>
        </View>
      )}
      
      <Footer />
    </View>
  );
};

const StatItem = ({icon, label, value}) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={16} color="#6b7280" />
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={styles.statValue}>{value}</Text>
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
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    marginBottom: 16,
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
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsWrapper: {
    flex: 1,
  },
  summary: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  fileNumberBadge: {
    backgroundColor: '#6366f1',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBadge: {
    backgroundColor: '#ef4444',
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorMessageText: {
    fontSize: 13,
    color: '#991b1b',
  },
  fileNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  fileNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  previewContainer: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  imageActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  imageActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
  fileActionsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fef7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  fileActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  fileActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fileActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  fileActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338ca',
  },
  additionalInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  additionalInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  },
});

export default BatchAnalyzerScreen;
