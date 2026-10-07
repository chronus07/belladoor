import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * BellaDoor Mobile App Entrypoint
 * Carrega a experiência mobile nativa com suporte a GPS e Push Notifications
 */
export default function App() {
  const productionUrl = 'https://belladoor.app/pro';
  // Em desenvolvimento local pode apontar para o IP local da máquina
  const devUrl = 'http://192.168.1.109:3000';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1917" />
      <WebView
        source={{ uri: __DEV__ ? devUrl : productionUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        geolocationEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
