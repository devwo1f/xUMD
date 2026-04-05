import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileCompletionScreen from '../features/auth/screens/ProfileCompletionScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ProfileCompletion"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
    </Stack.Navigator>
  );
}
