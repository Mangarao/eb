import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Alert, Platform, PermissionsAndroid} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {unzip} from 'react-native-zip-archive';
import RNFS from 'react-native-fs';
import RNBlobUtil from 'react-native-blob-util';
import {analyzeBatch} from '../services/api';
import Footer from '../components/Footer';

const ZipExtractorScreen = () => {
  const [loading, setLoading] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [zipName, setZipName] = useState(null);
  const [extractPath, setExtractPath] = useState(null);

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    
    if (Platform.Version >= 33) {
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

  const pickZipFile = async () => {
    try {
      setError(null);
      const zipFile = await DocumentPicker.pick({
        type: [DocumentPicker.types.zip],
      });
      
      // Check file size (max 50MB like web version)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (zipFile[0].size && zipFile[0].size > maxSize) {
        setError('File too large. Maximum size is 50MB');
        return;
      }
      
      setLoading(true);
      setZipName(zipFile[0].name);
      const extractDirectory = `${RNFS.CachesDirectoryPath}/extracted_${Date.now()}`;
      await RNFS.mkdir(extractDirectory);
      setExtractPath(extractDirectory);
      
      // Handle content:// URIs by copying to cache first
      let zipPath = zipFile[0].uri;
      if (zipPath.startsWith('content://')) {
        const tempZipPath = `${RNFS.CachesDirectoryPath}/temp_${Date.now()}.zip`;
        await RNFS.copyFile(zipPath, tempZipPath);
        zipPath = tempZipPath;
      } else if (zipPath.startsWith('file://')) {
        zipPath = zipPath.replace('file://', '');
      }
      
      await unzip(zipPath, extractDirectory);
      
      // Clean up temp zip if we created one
      if (zipFile[0].uri.startsWith('content://')) {
        await RNFS.unlink(zipPath).catch(() => {});
      }
      
      // Recursively read all files in extracted directory
      const getAllFiles = async (dirPath) => {
        const items = await RNFS.readDir(dirPath);
        let files = [];
        
        for (const item of items) {
          if (item.isFile()) {
            files.push(item);
          } else if (item.isDirectory()) {
            const subFiles = await getAllFiles(item.path);
            files = files.concat(subFiles);
          }
        }
        
        return files;
      };
      
      const allFiles = await getAllFiles(extractDirectory);
      console.log('Extracted files:', allFiles.map(f => f.name));
      
      if (allFiles.length > 0) {
        // Separate embroidery files from other files
        const embroideryFiles = allFiles.filter(f => 
          /\.(dst|jef|pes|exp|vp3|xxx|pec|hus|sew)$/i.test(f.name)
        );
        
        // Analyze embroidery files if any exist
        let analyzedData = [];
        if (embroideryFiles.length > 0) {
          const embFileObjects = embroideryFiles.map(f => ({
            uri: 'file://' + f.path,
            name: f.name,
            type: 'application/octet-stream',
            path: f.path,
            size: f.size,
          }));
          
          try {
            const analysis = await analyzeBatch(embFileObjects);
            analyzedData = analysis.map((item, index) => ({
              ...item,
              path: embFileObjects[index].path,
              size: embFileObjects[index].size,
            }));
          } catch (err) {
            console.warn('Analysis failed:', err);
          }
        }
        
        // Show all files, with analysis data for embroidery files
        const allFileObjects = allFiles.map(f => {
          const analyzed = analyzedData.find(a => a.filename === f.name);
          return {
            filename: f.name,
            path: f.path,
            size: f.size,
            isEmbroidery: /\.(dst|jef|pes|exp|vp3|xxx|pec|hus|sew)$/i.test(f.name),
            ...(analyzed || {}),
          };
        });
        
        setExtractedFiles(allFileObjects);
      } else {
        setError('No files found in ZIP');
        setExtractedFiles([]);
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        console.error('Extract error:', err);
        setError(err.message || 'Failed to extract ZIP');
      }
    }
  };

  const downloadFile = async (file) => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is needed to download files');
        return;
      }

      // Create temp file first
      const tempPath = `${RNFS.CachesDirectoryPath}/${file.filename}`;
      await RNFS.copyFile(file.path, tempPath);

      // Save to MediaStore (Android 10+)
      const result = await RNBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: file.filename,
          parentFolder: 'Download',
          mimeType: 'application/octet-stream',
        },
        'Download',
        tempPath
      );

      // Trigger media scan
      await RNBlobUtil.fs.scanFile([{path: tempPath}]);

      // Clean up temp file
      await RNFS.unlink(tempPath);

      Alert.alert('Success', `${file.filename} saved to Downloads`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', error.message || 'Could not download file');
    }
  };

  const downloadAll = async () => {
    if (extractedFiles.length === 0) return;

    Alert.alert(
      'Download All Files',
      `Download all ${extractedFiles.length} files to your device?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Download',
          onPress: async () => {
            try {
              const hasPermission = await requestStoragePermission();
              if (!hasPermission) {
                Alert.alert('Permission Required', 'Storage permission is needed');
                return;
              }

              let successCount = 0;
              for (const file of extractedFiles) {
                try {
                  const tempPath = `${RNFS.CachesDirectoryPath}/${file.filename}`;
                  await RNFS.copyFile(file.path, tempPath);
                  
                  await RNBlobUtil.MediaCollection.copyToMediaStore(
                    {
                      name: file.filename,
                      parentFolder: 'Download',
                      mimeType: 'application/octet-stream',
                    },
                    'Download',
                    tempPath
                  );
                  
                  await RNFS.unlink(tempPath);
                  successCount++;
                } catch (err) {
                  console.error(`Failed to download ${file.filename}:`, err);
                }
              }

              Alert.alert('Download Complete', `${successCount} of ${extractedFiles.length} files saved to Downloads`);
            } catch (error) {
              Alert.alert('Error', 'Failed to download files');
            }
          }
        }
      ]
    );
  };

  const cleanup = async () => {
    if (!extractPath) return;

    Alert.alert(
      'Clean Up',
      'Remove extracted files from cache?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clean Up',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(extractPath);
              setExtractedFiles([]);
              setZipName(null);
              setExtractPath(null);
              Alert.alert('Success', 'Cache cleaned up');
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert('Error', 'Failed to clean up cache');
            }
          }
        }
      ]
    );
  };

  const handleClear = async () => {
    try {
      // Cleanup extracted files if they exist
      if (extractPath) {
        await RNFS.unlink(extractPath).catch(e => console.log('Cleanup error:', e));
      }
      setExtractedFiles([]);
      setZipName(null);
      setExtractPath(null);
      setError(null);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const renderItem = ({item, index}) => {
    // Format file size
    const formatSize = (bytes) => {
      if (!bytes) return 'N/A';
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    };

    return (
      <View style={styles.fileCard}>
        {/* File Number & Name */}
        <View style={styles.fileHeaderRow}>
          <View style={styles.fileNumberBadge}>
            <Text style={styles.fileNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.fileNameContainer}>
            <Icon name="insert-drive-file" size={20} color="#f59e0b" />
            <Text style={styles.fileName} numberOfLines={2}>{item.filename}</Text>
          </View>
        </View>

        {/* File Details */}
        <View style={styles.fileDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Format:</Text>
            <Text style={styles.detailValue}>{item.format || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size:</Text>
            <Text style={styles.detailValue}>{formatSize(item.size)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stitches:</Text>
            <Text style={styles.detailValue}>{(item.stitch_count || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Colors:</Text>
            <Text style={styles.detailValue}>{item.color_count || 0}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dimensions:</Text>
            <Text style={styles.detailValue}>{item.width?.toFixed(1) || 0} × {item.height?.toFixed(1) || 0} mm</Text>
          </View>
        </View>

        {/* Download Button */}
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => downloadFile(item)}
        >
          <Icon name="download" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickZipFile} disabled={loading}>
          <Icon name="folder-zip" size={24} color="#fff" />
          <Text style={styles.uploadText}>
            {loading ? 'Extracting...' : 'Choose ZIP File'}
          </Text>
        </TouchableOpacity>
        
        {(extractedFiles.length > 0 || error) && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="clear" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Box - Hide when results are shown */}
      {extractedFiles.length === 0 && !loading && (
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            📌 Upload ZIP files (max 50MB){'\n'}
            📁 Extract embroidery files automatically{'\n'}
            💾 Download individual or all files
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loaderText}>Extracting and analyzing files...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={pickZipFile}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {extractedFiles.length > 0 && !loading && (
        <>
          {/* Summary Header */}
          <View style={styles.summaryHeader}>
            <View style={styles.summaryInfo}>
              <Icon name="folder-open" size={20} color="#f59e0b" />
              <Text style={styles.summaryText}>
                {zipName}
              </Text>
            </View>
            <Text style={styles.fileCount}>{extractedFiles.length} files</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.downloadAllButton}
              onPress={downloadAll}
            >
              <Icon name="cloud-download" size={20} color="#fff" />
              <Text style={styles.downloadAllText}>Download All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cleanupButton}
              onPress={cleanup}
            >
              <Icon name="delete-outline" size={20} color="#ef4444" />
              <Text style={styles.cleanupText}>Clean Up</Text>
            </TouchableOpacity>
          </View>

          {/* File List */}
          <FlatList
            data={extractedFiles}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}

      {extractedFiles.length === 0 && !loading && !error && (
        <View style={styles.emptyState}>
          <Icon name="folder-zip" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No ZIP file selected</Text>
          <Text style={styles.emptySubtext}>Upload a ZIP file to extract and manage embroidery designs</Text>
        </View>
      )}
      
      <Footer />
    </View>
  );
};

const StatBadge = ({icon, value}) => (
  <View style={styles.statBadge}>
    <Icon name={icon} size={14} color="#6b7280" />
    <Text style={styles.statText}>{value}</Text>
  </View>
);

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
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f59e0b',
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
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 20,
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
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryHeader: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  fileCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  downloadAllButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  downloadAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cleanupButton: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cleanupText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#ecfdf5',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 120,
  },
  fileCard: {
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
  fileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  fileNumberBadge: {
    backgroundColor: '#f59e0b',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  fileDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  downloadButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  fileStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
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
    paddingHorizontal: 32,
  },
});

export default ZipExtractorScreen;
