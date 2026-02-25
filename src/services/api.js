import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

// Configuration: Change USE_LOCAL to true for local testing
const USE_LOCAL = false;  // Set to true for local development
const LOCAL_API_URL = 'http://10.0.2.2:8000/api';  // For Android emulator, use your PC IP for real device
const VPS_API_URL = 'https://aarohisewing.com/embrobuddy/api';

// Embro Buddy API endpoint
const API_BASE_URL = USE_LOCAL ? LOCAL_API_URL : VPS_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeFile = async (file, screenName = 'viewer') => {
  try {
    console.log('Analyzing file:', file.name, 'URI:', file.uri, 'Screen:', screenName);
    
    const response = await RNBlobUtil.fetch(
      'POST',
      `${API_BASE_URL}/analyze`,
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: 'file',
          filename: file.name,
          type: file.type,
          data: RNBlobUtil.wrap(file.uri.replace('file://', '')),
        },
        {
          name: 'screen',
          data: screenName,
        },
      ]
    );

    console.log('Response status:', response.respInfo.status);
    console.log('Response data (first 200 chars):', response.data?.substring(0, 200));
    
    // Check for HTTP errors
    if (response.respInfo.status !== 200) {
      try {
        const errorData = JSON.parse(response.data);
        throw new Error(errorData.error || `Server error: ${response.respInfo.status}`);
      } catch (parseError) {
        throw new Error(`Server returned error: ${response.respInfo.status}`);
      }
    }
    
    // Try to parse response
    let data;
    try {
      data = JSON.parse(response.data);
    } catch (parseError) {
      console.log('Failed to parse response - Invalid JSON from server');
      throw new Error('Invalid response from server. Please try again.');
    }
    
    // Check if server returned an error
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Check if analysis was successful
    if (data.success === false) {
      throw new Error(data.error || 'Analysis failed');
    }
    
    return data;
  } catch (error) {
    console.log('Analyze file error:', error.message || error);
    
    // If error already has a message, preserve it
    if (error.message && !error.message.includes('unexpected')) {
      throw error;
    }
    
    // Handle specific network errors
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to server. Please check if the server is running.');
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Connection timed out. Please check your internet connection.');
    }
    
    // Handle stream errors - likely file format issue
    if (error.message && error.message.includes('unexpected end of stream')) {
      throw new Error('Unable to process file. The file may be corrupted or in an unsupported format.');
    }
    
    // Generic error
    throw new Error('Failed to analyze file. Please try again.');
  }
};

export const analyzeBatch = async (files) => {
  try {
    console.log('Batch analyzing', files.length, 'files');
    
    // Since there's no batch endpoint, analyze each file individually
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Analyzing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        const result = await analyzeFile(file, 'batch-analyzer');
        // Add filename to result if not present
        results.push({
          ...result,
          filename: result.filename || file.name,
        });
      } catch (error) {
        console.error(`Failed to analyze ${file.name}:`, error);
        // Add error result for this file
        results.push({
          filename: file.name,
          error: true,
          error_message: error.message || 'Analysis failed',
          format: 'Unknown',
          stitch_count: 0,
          color_count: 0,
          width: 0,
          height: 0,
        });
      }
    }
    
    console.log('Batch analysis complete:', results.length, 'results');
    return results;
  } catch (error) {
    console.error('Batch analyze error:', error);
    throw new Error('Failed to analyze files');
  }
};

export const convertFormat = async (file, targetFormat) => {
  try {
    console.log('=== CONVERSION START ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('File:', file.name, 'URI:', file.uri);
    console.log('Target format:', targetFormat);
    
    const response = await RNBlobUtil.fetch(
      'POST',
      `${API_BASE_URL}/convert`,
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: 'file',
          filename: file.name,
          type: file.type,
          data: RNBlobUtil.wrap(file.uri.replace('file://', '')),
        },
        {
          name: 'target_format',
          data: targetFormat.toLowerCase(), // Send lowercase format
        },
      ]
    );

    console.log('Response status:', response.respInfo.status);
    console.log('Response headers:', JSON.stringify(response.respInfo.headers));
    console.log('Raw response (first 500 chars):', response.data.substring(0, 500));
    
    const data = JSON.parse(response.data);
    console.log('Parsed response:', JSON.stringify(data));
    
    // Check for error in response
    if (data.error) {
      console.error('❌ Server returned error:', data.error);
      if (data.details) {
        console.error('Error details:', data.details);
      }
      throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
    }
    
    console.log('✅ Conversion successful');
    console.log('=== CONVERSION END ===');
    
    // Download converted file to device
    if (data.download_url) {
      const downloadPath = `${RNBlobUtil.fs.dirs.DownloadDir}/${data.filename}`;
      console.log('Downloading converted file to:', downloadPath);
      
      await RNBlobUtil.config({
        path: downloadPath,
        fileCache: true,
      }).fetch('GET', data.download_url);
      
      console.log('File downloaded to:', downloadPath);
      
      return {
        ...data,
        localPath: downloadPath,
      };
    }
    
    return data;
  } catch (error) {
    console.error('Convert format error:', error);
    throw new Error(error.message || 'Failed to convert file');
  }
};

export const exportImage = async (file) => {
  try {
    const response = await RNBlobUtil.fetch(
      'POST',
      `${API_BASE_URL}/export-image`,
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: 'file',
          filename: file.name,
          type: file.type,
          data: RNBlobUtil.wrap(file.uri.replace('file://', '')),
        },
      ]
    );

    const data = JSON.parse(response.data);
    return data;
  } catch (error) {
    console.error('Export image error:', error);
    throw new Error('Failed to export image');
  }
};

export default api;
