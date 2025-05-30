import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Image as RNImage,
  Pressable,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { RootStackParamList } from '../App';
import Tts from 'react-native-tts';
import PhotoManipulator, { RotationMode } from 'react-native-photo-manipulator';

Tts.setDefaultLanguage('en-US');
Tts.setDefaultVoice('com.apple.ttsbundle.Daniel-compact');

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Cameratest'
>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route: {
    params: {
      feature: 'Scantext' | 'ColorDetector' | 'QRScanner';
    };
  };
};

export default function Cameratest({ navigation, route }: Props) {
  Tts.setDefaultLanguage('en-US');
  Tts.setDefaultVoice('com.apple.ttsbundle.Daniel-compact')
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');

  const [showCamera, setShowCamera] = useState(false);
  const [imageSource, setImageSource] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    async function getPermission() {
      await Camera.requestCameraPermission();
    }
    getPermission();
  }, []);

  const featureToScreen = (
    feature: 'Scantext' | 'ColorDetector' | 'QRScanner'
  ) => feature;

  const capturePhoto = async () => {
    if (camera.current !== null) {
      const photo = await camera.current.takePhoto({});
      const originalPath = `file://${photo.path}`;

      try {
        const rotatedPath = originalPath;

        RNImage.getSize(
          rotatedPath,
          async (rotatedWidth, rotatedHeight) => {

            const cropRegion = {
              x: rotatedWidth * 0.3,
              y: rotatedHeight * 0.3,
              width: rotatedWidth * 0.4,
              height: rotatedHeight * 0.4,
            };

            const croppedPath = await PhotoManipulator.crop(rotatedPath, cropRegion);

            RNImage.getSize(
              croppedPath,
              (finalWidth, finalHeight) => {
                setImageSource(croppedPath);
                setImageSize({ width: finalWidth, height: finalHeight });
                setShowCamera(false);
              },
              (error) => {
                console.error('Final getSize failed:', error);
                setImageSource(croppedPath);
                setShowCamera(false);
              }
            );
          },
          (err) => {
            console.error('GetSize after rotate failed:', err);
            setImageSource(originalPath);
            setShowCamera(false);
          }
        );
      } catch (e) {
        console.error('Capture process failed:', e);
        setImageSource(originalPath);
        setShowCamera(false);
      }
    }
  };

  const uploadFromLibrary = () => {
    Tts.speak('Upload a photo');
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.uri || '';
        if (uri) {
          RNImage.getSize(
            uri,
            (width, height) => {
              setImageSource(uri);
              setImageSize({ width, height });
            },
            (err) => {
              console.error('Gallery getSize failed:', err);
              setImageSource(uri);
            }
          );
        }
      }
    });
  };

  if (device == null) return <Text>Camera not available</Text>;

  return (
    <View style={styles.container}>
      {showCamera ? (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={showCamera}
            photo={true}
          />
          <View style={styles.overlayBox} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.camButton} onPress={capturePhoto} />
          </View>
        </>
      ) : (
        <>
          {imageSource !== '' && (
            <Image
              style={[
                styles.image,
                imageSize.width > 0 && imageSize.height > 0 && {
                  aspectRatio: imageSize.width / imageSize.height,
                },
              ]}
              source={{ uri: imageSource }}
              resizeMode="contain"
            />
          )}

          {!showCamera && imageSource === '' && (
            <View style={styles.backButton}>
              <Pressable
                onPress={() => {
                  setShowCamera(true);
                  Tts.speak('Take a photo');
                }}
                style={({ pressed }) => [
                  styles.takeaPhotoBtn,
                  pressed && styles.takeaPhotoBtnPressed,
                ]}
              >
                <Text style={styles.backText}>Take a Photo</Text>
              </Pressable>
              <Pressable
                onPress={uploadFromLibrary}
                style={({ pressed }) => [
                  styles.takeaPhotoBtn,
                  pressed && styles.takeaPhotoBtnPressed,
                ]}
              >
                <Text style={styles.backText}>Upload a Photo</Text>
              </Pressable>
            </View>
          )}

          {imageSource !== '' && (
            <View style={styles.buttonContainer}>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => {
                    setImageSource('');
                    setImageSize({ width: 0, height: 0 });
                    Tts.speak('Retake');
                  }}
                >
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.useBtn}
                  onPress={() => {
                    navigation.navigate(
                      featureToScreen(route.params.feature),
                      { imagePath: imageSource }
                    );
                    Tts.speak('Use photo');
                  }}
                >
                  <Text style={styles.useText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E5',
  },
  backButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  takeaPhotoBtn: {
    backgroundColor: '#4D768D',
    height: '47.5%',
    marginBottom: '2.5%',
    marginTop: '2.5%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderColor: '#fff',
    width: '100%',
  },
  takeaPhotoBtnPressed: {
    backgroundColor: '#22668D',
  },
  backText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  buttonContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    padding: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  camButton: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#B2BEB5',
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  image: {
    width: '100%',
    maxHeight: '100%',
  },
  retakeBtn: {
    backgroundColor: '#fff',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  retakeText: {
    color: '#77c3ec',
    fontWeight: '500',
    fontSize: 16,
  },
  useBtn: {
    backgroundColor: '#77c3ec',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  useText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  overlayBox: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: '80%',
    height: '40%',
    borderWidth: 2,
    borderColor: 'white',
    borderStyle: 'dashed',
    zIndex: 99,
  },
});
