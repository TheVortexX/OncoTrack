import React, { useCallback, useEffect, useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, ScrollView, ImageBackground, StatusBar } from 'react-native';
import TrackingOptionsScroll from '@/components/trackingButtons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import EmergencyButton from '@/components/emergencyButton';
import TodaySchedule from '@/components/todaySchedule';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const headerImages = [
  require('@/assets/images/homeSplash/firewatch_tower.webp'),
  require('@/assets/images/homeSplash/river_boat.webp'),
  require('@/assets/images/homeSplash/zen_garden.webp'),
];


export default function HomeScreen() {
  const { getProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [headerImage, setHeaderImage] = useState();
  const insets = useSafeAreaInsets();

  const selectRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * headerImages.length);
    setHeaderImage(headerImages[randomIndex]);
  };

  useFocusEffect(
    useCallback(() => {
      selectRandomImage();

      const loadProfile = async () => {
        const profile = await getProfile();
        if (profile) {
          setUsername(profile.fName);
        }
      };
      loadProfile();
    }, [])
  );

  const greeting = getGreeting(username);

  return (
    <View style={[styles.container, {marginBottom: insets.bottom+50}]}>
      <StatusBar 
        translucent
        backgroundColor={"transparent"}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={headerImage || require('@/assets/images/homeSplash/firewatch_tower.webp')}
          style={styles.header}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <Text style={styles.greeting} allowFontScaling={false}>
              {greeting}
            </Text>
          </View>
        </ImageBackground>

        <TrackingOptionsScroll />

        <TodaySchedule />

      </ScrollView>
      <View style={styles.emergencyButtonContainer}>
        <EmergencyButton />
      </View>
    </View>
  );
}

function getGreeting(username: string) {
  if (username){
    username = ", " + username
  }
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning" + username + "!"
  if (hour < 18) return "Good Afternoon" + username + "!"
  return "Good Evening" + username + "!";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.blue99,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    width: "100%",
    aspectRatio: 16/9,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: theme.colours.blue0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    marginHorizontal: '5%',
  },
  greeting: {
    alignSelf: 'center',
    fontSize: normaliseSize(30),
    color: 'white',
    fontFamily: theme.fonts.ubuntu.bold,
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 50,
    right: 16,
  }
});