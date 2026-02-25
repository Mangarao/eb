import React, {useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Linking, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import BatchAnalyzerScreen from './src/screens/BatchAnalyzerScreen';
import ConverterScreen from './src/screens/ConverterScreen';
import ZipExtractorScreen from './src/screens/ZipExtractorScreen';
import EstimatorScreen from './src/screens/EstimatorScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  const navigationRef = useRef();

  useEffect(() => {
    // Handle initial URL when app is opened from external source
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleOpenURL({url: initialUrl});
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', handleOpenURL);

    handleInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleOpenURL = ({url}) => {
    if (url && navigationRef.current) {
      // Check file extension to determine which screen to open
      const isZipFile = url.toLowerCase().endsWith('.zip');
      
      if (isZipFile) {
        // Navigate to ZIP Extractor screen for zip files
        navigationRef.current.navigate('ZIP', {
          fileUri: url,
          fromIntent: true
        });
      } else {
        // Navigate to Viewer screen for embroidery files
        navigationRef.current.navigate('Viewer', {
          fileUri: url,
          fromIntent: true
        });
      }
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            let iconName;
            switch (route.name) {
              case 'Home':
                iconName = 'home';
                break;
              case 'Viewer':
                iconName = 'visibility';
                break;
              case 'Batch':
                iconName = 'analytics';
                break;
              case 'Converter':
                iconName = 'transform';
                break;
              case 'ZIP':
                iconName = 'folder-zip';
                break;
              case 'Estimator':
                iconName = 'calculate';
                break;
              default:
                iconName = 'circle';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Viewer" component={ViewerScreen} />
        <Tab.Screen name="Batch" component={BatchAnalyzerScreen} />
        <Tab.Screen name="Converter" component={ConverterScreen} />
        <Tab.Screen name="ZIP" component={ZipExtractorScreen} />
        <Tab.Screen name="Estimator" component={EstimatorScreen} options={{title: 'Estimator'}} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
