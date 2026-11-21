import React, { useState, useRef, useEffect } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';

import {
  mobileMicrosoftLogin,
  selectMicrosoftAccount,
} from '../../services/MicrosoftLoginApi';

import { saveAuthToken } from '../../services/SecureTokenStorage';

import MicrosoftAuthService from '../../services/MicrosoftAuthService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MicrosoftLoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectionToken, setSelectionToken] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [processingMessage, setProcessingMessage] = useState('Signing in...');
  const [microsoftProfile, setMicrosoftProfile] = useState(null);
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Animations
  const glowPulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.25,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();

    // Floating accent loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const getApplicationToken = response => {
    return (
      response?.access_token ||
      response?.data?.access_token ||
      response?.token ||
      null
    );
  };

  const getVerifiedToken = response => {
    return (
      response?.access_token ||
      response?.token ||
      response?.bearer_token ||
      response?.data?.access_token ||
      response?.data?.token ||
      response?.data?.bearer_token ||
      null
    );
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setProcessingMessage('Signing in with Microsoft...');

      // 1. Microsoft sign-in
      const authResult = await MicrosoftAuthService.signIn();

      if (!authResult?.accessToken) {
        throw new Error('Microsoft access token not received.');
      }

      // 2. Get Microsoft profile
      const profile = await MicrosoftAuthService.getUserProfile(
        authResult.accessToken,
      );

      setMicrosoftProfile(profile);

      // 3. Send Microsoft token to backend
      setProcessingMessage('Verifying your account...');

      const loginResponse = await mobileMicrosoftLogin(authResult.accessToken);

      if (!loginResponse?.success) {
        throw new Error(loginResponse?.message || 'Login failed.');
      }

      // 4. Multiple accounts
      if (loginResponse.requires_account_choice) {
        if (!loginResponse.accounts || loginResponse.accounts.length === 0) {
          throw new Error('No accounts available for selection.');
        }

        setAvailableAccounts(loginResponse.accounts);
        setSelectionToken(loginResponse.selection_token);
        setSelectedAccount(null);
        setAccountModalVisible(true);

        setLoading(false);
        return;
      }

      // 5. Single account - backend token
      const appToken = loginResponse.access_token;

      if (!appToken) {
        throw new Error('Access token not received from backend.');
      }

      // 6. Save backend token directly
      const saved = await saveAuthToken(appToken);

      if (!saved) {
        throw new Error('Unable to save access token.');
      }

      // 7. Navigate to Dashboard
      navigation.replace('DashbaordScreen', {
        microsoftUser: profile,
        microsoftAccount: authResult.account,
      });
    } catch (error) {
      console.log(
        'Microsoft Login Error:',
        error?.response?.data || error.message,
      );

      Alert.alert(
        'Microsoft Login Failed',
        error?.response?.data?.message ||
          error.message ||
          'Unable to sign in with Microsoft.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMicrosoftAccount = async account => {
    if (!selectionToken || !account?.key) {
      Alert.alert('Error', 'Account selection information is missing.');
      return;
    }

    try {
      setLoading(true);
      setProcessingMessage('Connecting to selected account...');

      // 1. Call backend with selected account
      const response = await selectMicrosoftAccount(
        selectionToken,
        account.key,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Account selection failed.');
      }

      // 2. Get backend access token
      const appToken = response.access_token;

      if (!appToken) {
        throw new Error('Access token not received from backend.');
      }

      // 3. Save token directly
      const saved = await saveAuthToken(appToken);

      if (!saved) {
        throw new Error('Unable to save access token.');
      }

      // 4. Close account selection modal
      setAccountModalVisible(false);
      setSelectionToken(null);
      setAvailableAccounts([]);
      setSelectedAccount(null);

      // 5. Navigate to Dashboard
      navigation.replace('DashbaordScreen', {
        microsoftUser: microsoftProfile,
        microsoftSelectedAccount: account,
      });
    } catch (error) {
      console.log(
        'Account Selection Error:',
        error?.response?.data || error.message,
      );

      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ||
          error.message ||
          'Unable to login with selected account.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4A3FB8" barStyle="light-content" />

      {/* Gradient-like background layers */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.bgLayer, styles.bgLayerTop]} />
        <View style={[styles.bgLayer, styles.bgLayerBottom]} />
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
        <View style={[styles.bgCircle, styles.bgCircle4]} />
        <View style={[styles.bgCircle, styles.bgCircle5]} />
      </View>

      {/* Floating accent dots */}
      <Animated.View
        style={[
          styles.floatingDot,
          styles.floatingDot1,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingDot,
          styles.floatingDot2,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 25],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingDot,
          styles.floatingDot3,
          {
            transform: [
              {
                translateX: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Hero: Logo with glow ring */}

        <View style={styles.contentContainer}>
          {/* Logo with glow effect */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <Animated.View
                style={[
                  styles.logoGlow,
                  {
                    transform: [{ scale: glowPulse }],
                  },
                ]}
              />
              <Image
                source={require('../../asset/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Title */}
        </View>

        {/* Headline */}
        <View style={styles.headerArea}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Sign in using your Microsoft 365 account
          </Text>
        </View>

        {/* Glass card */}
        <View style={styles.card}>
          <View style={styles.cardShine} />

          <Text style={styles.cardHeading}>Get Started</Text>

          <Text style={styles.cardDescription}>
            You'll be securely redirected to Microsoft to authenticate. Your
            credentials are never stored on this device.
          </Text>

          {/* Sign in button with MS logo */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.microsoftButton,
                loading && styles.microsoftButtonDisabled,
              ]}
              onPress={handleMicrosoftLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>Signing in...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.btnLogoWrapper}>
                    <Image
                      source={require('../../asset/microsoft.png')}
                      style={{ height: 16, width: 16 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.buttonText}>Sign in with Microsoft</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Secure note */}
          <View style={styles.secureRow}>
            <View style={styles.secureDot} />
            <Text style={styles.secureText}>
              End-to-end encrypted authentication
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Powered by LeafCom</Text>
          <View style={styles.footerLine} />
        </View>
      </Animated.View>

      <Modal
        visible={accountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) {
            setAccountModalVisible(false);
          }
        }}
      >
        <View style={styles.accountModalOverlay}>
          <View style={styles.accountModalContainer}>
            <Text style={styles.accountModalTitle}>Select Your Account</Text>

            <Text style={styles.accountModalSubtitle}>
              Multiple profiles were found for your Microsoft account. Choose
              the profile you want to continue with.
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            >
              {availableAccounts.map(account => {
                const isSelected = selectedAccount?.key === account.key;

                return (
                  <Pressable
                    key={account.key}
                    onPress={() => setSelectedAccount(account)}
                    disabled={loading}
                    style={[
                      styles.accountCard,
                      isSelected && styles.accountCardSelected,
                    ]}
                  >
                    <View style={styles.accountCardContent}>
                      <View style={styles.accountRadioOuter}>
                        {isSelected && (
                          <View style={styles.accountRadioInner} />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.accountSystem}>
                          {account.system}
                        </Text>

                        <Text style={styles.accountName}>{account.name}</Text>

                        <Text style={styles.accountRole}>{account.role}</Text>

                        <Text style={styles.accountLabel}>{account.label}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loading && (
              <View style={styles.accountLoadingRow}>
                <ActivityIndicator color="#5C4FC9" />
                <Text style={styles.accountLoadingText}>
                  {processingMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.accountContinueButton,
                (!selectedAccount || loading) && styles.accountContinueDisabled,
              ]}
              disabled={!selectedAccount || loading}
              onPress={() => handleSelectMicrosoftAccount(selectedAccount)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.accountContinueText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountCancelButton}
              disabled={loading}
              onPress={() => {
                setAccountModalVisible(false);
                setSelectionToken(null);
                setAvailableAccounts([]);
                setSelectedAccount(null);
              }}
            >
              <Text style={styles.accountCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MicrosoftLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5C4FC9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // ================= BACKGROUND =================
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  bgLayerTop: {
    top: 0,
    height: '55%',
    backgroundColor: '#5C4FC9',
  },
  bgLayerBottom: {
    bottom: 0,
    height: '45%',
    backgroundColor: '#4A3FB8',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  bgCircle1: { width: 350, height: 350, top: -120, right: -80, opacity: 0.08 },
  bgCircle2: { width: 280, height: 280, bottom: -60, left: -70, opacity: 0.06 },
  bgCircle3: { width: 220, height: 220, top: 80, left: -40, opacity: 0.05 },
  bgCircle4: { width: 200, height: 200, top: 160, right: -30, opacity: 0.07 },
  bgCircle5: { width: 160, height: 160, bottom: 100, right: 40, opacity: 0.06 },

  // Floating accent dots
  floatingDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFD700',
  },
  floatingDot1: { width: 8, height: 8, top: '18%', left: '12%', opacity: 0.6 },
  floatingDot2: { width: 6, height: 6, top: '30%', right: '15%', opacity: 0.4 },
  floatingDot3: {
    width: 10,
    height: 10,
    bottom: '22%',
    left: '18%',
    opacity: 0.5,
  },

  // ================= CONTENT =================
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 25,
    zIndex: 5,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    width: 140,
    height: 140,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  // Microsoft logo (hero, large)
  msLogo: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  msSquare: {
    width: 20,
    height: 20,
    marginRight: 4,
    marginBottom: 4,
  },
  msRed: { backgroundColor: '#F25022' },
  msGreen: { backgroundColor: '#7FBA00' },
  msBlue: { backgroundColor: '#00A4EF' },
  msYellow: { backgroundColor: '#FFB900' },

  // Header
  headerArea: {
    alignItems: 'center',
    marginVertical: 26,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginVertical: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 20,
    paddingHorizontal: 15,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
    overflow: 'hidden',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 22,
  },

  // Button
  microsoftButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  microsoftButtonDisabled: {
    opacity: 0.75,
  },
  btnLogoWrapper: {
    width: 24,
    height: 24,
    borderRadius: 4,

    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnMsLogo: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  btnMsSquare: {
    width: 7,
    height: 7,
    marginRight: 1.5,
    marginBottom: 1.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Secure note
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  secureText: {
    fontSize: 11,
    color: '#888888',
    letterSpacing: 0.3,
    fontWeight: '500',
  },

  // Footer
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    opacity: 0.55,
  },
  footerLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 10,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  logoImage: {
    width: 180,
    height: 70,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFF',
  },
  logoIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  logoInnerGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
  },

  accountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  accountModalContainer: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },

  accountModalTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 8,
  },

  accountModalSubtitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },

  accountCard: {
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  accountCardSelected: {
    borderColor: '#5C4FC9',
    backgroundColor: '#F5F2FF',
  },

  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accountRadioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5C4FC9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  accountRadioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#5C4FC9',
  },

  accountSystem: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4FC9',
    marginBottom: 3,
  },

  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  accountRole: {
    fontSize: 13,
    color: '#666666',
    marginTop: 3,
  },

  accountLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 5,
  },

  accountLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 10,
  },

  accountLoadingText: {
    fontSize: 13,
    color: '#666666',
  },

  accountContinueButton: {
    backgroundColor: '#5C4FC9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },

  accountContinueDisabled: {
    opacity: 0.5,
  },

  accountContinueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  accountCancelButton: {
    paddingVertical: 13,
    alignItems: 'center',
  },

  accountCancelText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
});
