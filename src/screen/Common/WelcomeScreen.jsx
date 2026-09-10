import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WelcomeScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
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
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 8 + 2;

        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }

        return newProgress;
      });
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    if (progress >= 100) {
      // Small delay after reaching 100%
      const timer = setTimeout(() => {
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(({ finished }) => {
          if (finished && onFinish) {
            onFinish();
          }
        });
      }, 105);

      return () => clearTimeout(timer);
    }
  }, [progress, onFinish]);

  // Update progress bar width
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar backgroundColor="#5C4FC9" barStyle="light-content" />

      {/* Decorative light circles - subtle violet tones */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
        <View style={[styles.bgCircle, styles.bgCircle4]} />
        <View style={[styles.bgCircle, styles.bgCircle5]} />
      </View>



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

          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>
            Leaf<Text style={styles.titleHighlight}>Com</Text>
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v2.0</Text>
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, { opacity: subtitleOpacity }]}>
          <View style={styles.subtitleDot} />
          <Text style={styles.subtitle}>Communication Hub</Text>
          <View style={styles.subtitleDot} />
        </Animated.View>

        {/* Loading Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Loading dots animation */}
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.loadingDot,
                {
                  animationDelay: `${i * 0.2}s`,
                  opacity: progress < 100 ? 1 : 0,
                },
              ]}
            />
          ))}
        </View>

        {/* Powered by */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Powered by LeafCom</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5C4FC9', // Single violet color
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  bgCircle1: {
    width: 350,
    height: 350,
    backgroundColor: '#FFFFFF',
    top: -120,
    right: -80,
  },
  bgCircle2: {
    width: 280,
    height: 280,
    backgroundColor: '#FFFFFF',
    bottom: -60,
    left: -70,
  },
  bgCircle3: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
    top: 80,
    left: -40,
  },
  bgCircle4: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    top: 160,
    right: -30,
  },
  bgCircle5: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    bottom: 100,
    right: 40,
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    gap: 2,
    zIndex: 10,
  },
  stripColor: {
    width: 35,
    height: 4,
    borderRadius: 2,
    opacity: 0.9,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleHighlight: {
    color: '#FFD700',
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginLeft: 10,
    marginTop: -8,
  },
  versionText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  subtitleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 2,
    fontWeight: '500',
  },
  progressContainer: {
    width: SCREEN_WIDTH * 0.7,
    marginBottom: 16,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  footerContainer: {
    position: 'absolute',
    bottom: -80,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    letterSpacing: 1,
  },
});

export default WelcomeScreen;