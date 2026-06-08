/**
 * ═══════════════════════════════════════════════════════════════
 *  RichSplash — Splash rico in-app com a peça colorida
 *  Exibido por ~2s enquanto o app verifica sessão/carrega dados
 *  Fade-out animado ao concluir
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Typography } from '../../constants/theme';

const SPLASH_DURATION = 2200; // ms
const FADE_DURATION = 400;    // ms

type RichSplashProps = {
  /** Chamado quando o splash termina (após fade-out) */
  onDone: () => void;
};

export function RichSplash({ onDone }: RichSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade-out suave
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        onDone();
      });
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [onDone, opacity]);

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <ImageBackground
        source={require('../../assets/brand/splash-bg.png')}
        style={styles.bg}
        resizeMode="cover"
        accessibilityLabel="Inácio Arruda — Pro povo voltar a ser feliz"
      >
        {/* ═══ OVERLAY para contraste ═══ */}
        <View style={styles.overlay} />

        {/* ═══ CONTEÚDO INFERIOR ═══ */}
        <View style={styles.content}>
          <Text style={styles.brandName}>Rede de Embaixadores</Text>
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.loader}
          />
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 72,
    gap: 16,
  },
  brandName: {
    ...Typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  loader: {
    marginTop: 4,
  },
});
