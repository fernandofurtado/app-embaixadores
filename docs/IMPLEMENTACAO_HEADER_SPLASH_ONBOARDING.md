# Implementação — Logo no Header, Splash e Onboarding
## Rede de Embaixadores — Campanha Inácio Arruda

**Versão:** 1.0
**Data:** 2026-06-08
**Escopo:** Definição técnica para (1) exibir o retrato do candidato como logo persistente no header de todas as telas, e (2) usar a peça colorida da campanha como background do splash e das telas de onboarding.
**Stack-alvo:** React Native + Expo (mobile-first). As instruções incluem o equivalente web (React) quando relevante.

> **Premissa explicitada:** este guia assume o app mobile como produto principal (mobile-first é premissa do projeto). Caso o front seja web puro, as seções de código React Native têm o equivalente CSS/React indicado.

---

## 1. Mapeamento dos assets

Três imagens foram fornecidas. A função de cada uma no app:

| Arquivo original | Dimensões | Função no app | Justificativa |
|---|---|---|---|
| `Inacio-Arruda-03.png` | 416×416 | **Logo do header** (todas as telas) | Retrato em enquadramento quadrado/centralizado, fundo neutro claro — recorta bem em formato circular pequeno. Leve e legível em escala reduzida. |
| `1780939065986_image.png` | 1080×1007 | **Background de splash + onboarding** | Peça mais colorida (verde/amarelo/azul/vermelho + wordmark INÁCIO). Alta energia visual, ideal para a primeira impressão e telas de boas-vindas. |
| `Inacio-Arruda.jpg` | 639×474 | **Reserva** (avatar alternativo / fallback) | Retrato secundário (tribuna). Mantido como fallback ou uso em telas internas de perfil/sobre. |

### 1.1 Estrutura de pastas recomendada

```
assets/
├── brand/
│   ├── logo-inacio.png          # cópia de Inacio-Arruda-03.png (logo header)
│   ├── logo-inacio@2x.png       # 832×832 (opcional, telas de alta densidade)
│   ├── splash-bg.png            # cópia de 1780939065986_image.png
│   └── portrait-alt.jpg         # cópia de Inacio-Arruda.jpg (reserva)
└── icons/
    └── ...
```

**Ação:** copie os uploads para `assets/brand/` com os nomes acima. Renomear evita acoplar o código a nomes crípticos como `1780939065986_image.png`.

---

## 2. Tokens visuais (referência)

Use os tokens já definidos no Design System Inácio Arruda. Resumo dos que importam para estas telas:

```ts
// Cores institucionais
const Brand = {
  blue:   '#2171BA',
  red:    '#E33431',
  yellow: '#FAD549',
  green:  '#4DAA35',
  ink:    '#1D1D1F',
  white:  '#FFFFFF',
  offwhite:'#F1F2F4',
  gray200:'#D4DFE2',
  muted:  '#5F6368',
};

// Barra de cores (assinatura) — ordem oficial
const ColorBar = ['#E33431', '#FAD549', '#4DAA35', '#2171BA']; // vermelho, amarelo, verde, azul
```

---

## 3. Header com logo persistente

### 3.1 Objetivo

Um header fixo, presente em **todas** as telas autenticadas, com o retrato do candidato à esquerda funcionando como logo. Abaixo do header, a barra de cores oficial como assinatura visual.

### 3.2 Componente `AppHeader` (React Native)

```tsx
// components/AppHeader.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppHeaderProps = {
  title?: string;          // título da tela atual (opcional)
  right?: React.ReactNode; // ações à direita (ex.: notificações, pontos)
};

export function AppHeader({ title, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* LOGO — retrato do candidato em formato circular */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/brand/logo-inacio.png')}
            style={styles.logo}
            accessibilityLabel="Inácio Arruda — Rede de Embaixadores"
            resizeMode="cover"
          />
          <Text style={styles.brandText} numberOfLines={1}>
            {title ?? 'Rede de Embaixadores'}
          </Text>
        </View>

        {/* AÇÕES À DIREITA */}
        <View style={styles.right}>{right}</View>
      </View>

      {/* BARRA DE CORES — assinatura visual oficial */}
      <View style={styles.colorBar}>
        <View style={[styles.bar, { backgroundColor: '#E33431' }]} />
        <View style={[styles.bar, { backgroundColor: '#FAD549' }]} />
        <View style={[styles.bar, { backgroundColor: '#4DAA35' }]} />
        <View style={[styles.bar, { backgroundColor: '#2171BA' }]} />
      </View>
    </View>
  );
}

const LOGO_SIZE = 40;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    // sombra sutil (sem peso excessivo)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,   // circular
    borderWidth: 2,
    borderColor: '#F1F2F4',
    backgroundColor: '#F1F2F4',
  },
  brandText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '800',            // Montserrat ExtraBold quando carregada
    color: '#1D1D1F',
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorBar: {
    flexDirection: 'row',
    height: 4,
  },
  bar: { flex: 1, height: 4 },
});
```

### 3.3 Como garantir o header em TODAS as telas

Não repita `<AppHeader />` tela a tela — centralize na navegação. Com Expo Router / React Navigation:

```tsx
// Opção A — header customizado no navigator (Stack)
import { Stack } from 'expo-router';
import { AppHeader } from '../components/AppHeader';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => <AppHeader title={options.title} />,
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Início' }} />
      <Stack.Screen name="missoes" options={{ title: 'Missões' }} />
      <Stack.Screen name="ranking" options={{ title: 'Ranking' }} />
      <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Stack>
  );
}
```

Para apps com **tabs**, envolva o tab navigator dentro de um stack que injeta o header, ou renderize `<AppHeader />` no layout pai das tabs. O princípio: **um único ponto de definição**, telas só passam o `title`.

### 3.4 Equivalente Web (React + CSS)

```tsx
// Header.tsx
export function Header({ title = 'Rede de Embaixadores' }) {
  return (
    <header className="ia-app-header">
      <div className="ia-header-inner">
        <div className="ia-logo-wrap">
          <img src="/assets/brand/logo-inacio.png"
               alt="Inácio Arruda — Rede de Embaixadores"
               className="ia-logo" />
          <span className="ia-brand-text">{title}</span>
        </div>
        {/* ações à direita */}
      </div>
      <div className="ia-color-bar">
        <span></span><span></span><span></span><span></span>
      </div>
    </header>
  );
}
```

```css
.ia-app-header { position: sticky; top: 0; z-index: 100; background: #fff; }
.ia-header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 64px; padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.ia-logo-wrap { display: flex; align-items: center; gap: 12px; }
.ia-logo {
  width: 40px; height: 40px; border-radius: 50%;
  object-fit: cover; border: 2px solid #F1F2F4; background: #F1F2F4;
}
.ia-brand-text { font-weight: 800; font-size: 16px; color: #1D1D1F; }
.ia-color-bar { display: grid; grid-template-columns: repeat(4,1fr); height: 4px; }
.ia-color-bar > :nth-child(1){ background:#E33431; }
.ia-color-bar > :nth-child(2){ background:#FAD549; }
.ia-color-bar > :nth-child(3){ background:#4DAA35; }
.ia-color-bar > :nth-child(4){ background:#2171BA; }
```

### 3.5 Acessibilidade do logo

- `accessibilityLabel` / `alt` descritivo: identifica candidato + produto, nunca "imagem" ou "logo" genérico.
- Área de toque mínima de 44px se o logo for clicável (ex.: voltar ao início). Aumente o `hitSlop` se o ícone visual for 40px.
- Contraste do texto ao lado do logo: `#1D1D1F` sobre branco = AAA. OK.

---

## 4. Splash Screen

### 4.1 Estratégia

O splash nativo (mostrado antes do JS carregar) **não** comporta imagens complexas com texto sem risco de corte entre densidades de tela. Estratégia em duas camadas:

1. **Splash nativo (Expo):** fundo de cor sólida da marca + o **logo circular** centralizado. Rápido, sem distorção.
2. **Splash "rico" (in-app):** a peça colorida completa (`splash-bg.png`) exibida por ~1.5–2.5s enquanto o app verifica sessão/carrega dados. É aqui que a imagem colorida brilha.

### 4.2 Splash nativo — `app.json` (Expo)

```json
{
  "expo": {
    "splash": {
      "image": "./assets/brand/logo-inacio.png",
      "resizeMode": "contain",
      "backgroundColor": "#2171BA"
    },
    "android": {
      "splash": {
        "image": "./assets/brand/logo-inacio.png",
        "resizeMode": "contain",
        "backgroundColor": "#2171BA"
      }
    }
  }
}
```

> Cor de fundo `#2171BA` (azul institucional) dá um splash nativo estável. Alternativa: `#FFFFFF` se preferir o logo sobre branco.

### 4.3 Splash rico in-app (peça colorida) — React Native

```tsx
// components/RichSplash.tsx
import React, { useEffect } from 'react';
import { ImageBackground, View, ActivityIndicator, StyleSheet } from 'react-native';

export function RichSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000); // 2s; ajuste conforme carga real
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <ImageBackground
      source={require('../assets/brand/splash-bg.png')}
      style={styles.bg}
      resizeMode="cover"            // preenche a tela; veja nota 4.5
      accessibilityLabel="Inácio Arruda — Pro povo voltar a ser feliz"
    >
      {/* leve overlay para garantir contraste do indicador */}
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  overlay: { paddingBottom: 64 },
});
```

Uso no boot do app:

```tsx
// App.tsx (trecho)
const [booting, setBooting] = useState(true);
if (booting) return <RichSplash onDone={() => setBooting(false)} />;
return <MainNavigator />;
```

### 4.4 Equivalente Web (CSS)

```css
.ia-splash {
  position: fixed; inset: 0;
  background: url('/assets/brand/splash-bg.png') center / cover no-repeat;
  display: grid; place-items: end center;
}
```

### 4.5 Nota sobre enquadramento da peça colorida

A peça é quase quadrada (1080×1007) e tem **texto e rosto** que não podem ser cortados. Em telas de celular (altas e estreitas), `resizeMode="cover"` vai cortar laterais.

**Recomendação:** prepare duas variações para evitar corte do conteúdo crítico:
- **Mobile retrato:** versão com a arte centralizada e margens de respiro (canvas 1080×1920) com a peça ao centro sobre fundo `#F1F2F4` ou faixa de cor.
- **Tablet/web:** a peça original com `contain` sobre fundo sólido.

> Se quiser, o time pode me pedir que eu gere essas variações de canvas a partir da imagem original.

---

## 5. Onboarding

### 5.1 Conceito

3 a 4 telas de boas-vindas que explicam a jornada de gamificação (Apoiador → Coordenador de Rede). A peça colorida aparece como **background da primeira tela** (impacto), e nas demais usa-se um tratamento mais sóbrio (fundo claro + barra de cores) para garantir leitura do texto.

### 5.2 Padrão visual por tela

| Tela | Background | Conteúdo |
|---|---|---|
| 1 — Boas-vindas | Peça colorida (`splash-bg.png`) + overlay escuro 35% | "Bem-vindo à Rede de Embaixadores" + CTA |
| 2 — Missões e pontos | Fundo `#FFFFFF` + barra de cores | Como ganhar pontos cumprindo missões |
| 3 — Níveis | Fundo `#F1F2F4` + ilustração de níveis | A jornada dos 5 níveis |
| 4 — Permissões/LGPD | Fundo `#FFFFFF` | Consentimento de dados + iniciar |

> **Por que só a tela 1 usa a peça colorida cheia:** texto longo sobre arte muito colorida prejudica contraste e legibilidade (princípio de acessibilidade do design system: não usar amarelo com texto branco, evitar verde claro com texto branco em texto pequeno). A peça entrega o impacto inicial; as demais priorizam clareza.

### 5.3 Componente de tela de onboarding com background colorido (RN)

```tsx
// screens/OnboardingWelcome.tsx
import React from 'react';
import { ImageBackground, View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function OnboardingWelcome({ onNext }: { onNext: () => void }) {
  return (
    <ImageBackground
      source={require('../assets/brand/splash-bg.png')}
      style={styles.bg}
      resizeMode="cover"
      accessibilityLabel="Campanha Inácio Arruda"
    >
      {/* gradiente para legibilidade do texto na base */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title}>
          Bem-vindo à{'\n'}Rede de Embaixadores
        </Text>
        <Text style={styles.subtitle}>
          Participe, cumpra missões e ajude a transformar apoio em ação.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Começar"
        >
          <Text style={styles.ctaText}>Começar</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end' },
  content: { padding: 24, paddingBottom: 48 },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: '#F1F2F4',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  cta: {
    backgroundColor: '#E33431',   // CTA vermelho institucional
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 44,                // toque mínimo
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
```

> Dependência: `npx expo install expo-linear-gradient`.

### 5.4 Indicadores de página (dots)

```tsx
function Dots({ total, index }: { total: number; index: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'center', marginBottom: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          width: i === index ? 24 : 8,
          height: 8, borderRadius: 4,
          backgroundColor: i === index ? '#2171BA' : '#D4DFE2',
        }} />
      ))}
    </View>
  );
}
```

### 5.5 Controle de "primeira execução"

Mostre o onboarding só uma vez:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@onboarding_done';
export async function hasSeenOnboarding() {
  return (await AsyncStorage.getItem(KEY)) === '1';
}
export async function markOnboardingDone() {
  await AsyncStorage.setItem(KEY, '1');
}
```

> **Atenção LGPD:** a tela final do onboarding deve coletar consentimento explícito para tratamento de dados pessoais, com linguagem clara e link para a política de privacidade. Em contexto eleitoral (TSE + LGPD), registre data/hora e versão do termo aceito. Esta é uma zona regulatória sensível — **valide o texto de consentimento com o jurídico da campanha** antes de publicar. (Eu informo o requisito; não substituo aconselhamento legal.)

---

## 6. Checklist de implementação

- [ ] Copiar uploads para `assets/brand/` com nomes padronizados.
- [ ] Gerar `logo-inacio@2x.png` (832×832) para densidade alta (opcional).
- [ ] Implementar `AppHeader` e injetar via navigator (header único, não por tela).
- [ ] Adicionar barra de cores oficial abaixo do header.
- [ ] Configurar splash nativo no `app.json` (logo + fundo sólido).
- [ ] Implementar `RichSplash` com a peça colorida.
- [ ] Preparar variação de canvas 1080×1920 da peça para evitar corte em retrato (sob demanda).
- [ ] Implementar 3–4 telas de onboarding (tela 1 com peça colorida + overlay).
- [ ] Adicionar dots e navegação entre telas.
- [ ] Persistir flag de onboarding visto (AsyncStorage).
- [ ] Incluir tela de consentimento LGPD ao final — **validar texto com jurídico**.
- [ ] Testar contraste do texto sobre a peça colorida (overlay ≥ 35%).
- [ ] Testar em 360px (mobile pequeno), tablet e densidades 2x/3x.
- [ ] Verificar `accessibilityLabel`/`alt` em todas as imagens de marca.

---

## 7. Resumo das decisões

1. **Logo do header** = `Inacio-Arruda-03.png` (retrato circular), definido **uma vez** no navigator para aparecer em todas as telas, com a barra de cores como assinatura.
2. **Splash + onboarding** = `1780939065986_image.png` (peça colorida). Splash nativo usa logo + cor sólida; splash rico e tela 1 do onboarding usam a peça cheia com overlay para legibilidade.
3. **Reserva** = `Inacio-Arruda.jpg` como fallback/avatar alternativo.
4. **Cuidado de produto:** corte da peça em telas estreitas e consentimento LGPD são os dois pontos que exigem ação antes de produção.
