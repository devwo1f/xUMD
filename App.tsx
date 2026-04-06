import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { linking } from './src/navigation/linking';
import RootNavigator from './src/navigation/RootNavigator';
import AppProviders from './src/providers/AppProviders';
import { colors } from './src/shared/theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.main,
    background: colors.background.secondary,
    card: colors.background.primary,
    text: colors.text.primary,
    border: colors.border.light,
    notification: colors.primary.main,
  },
};

export default function App() {
  return (
    <AppProviders>
      <NavigationContainer theme={navigationTheme} linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}

