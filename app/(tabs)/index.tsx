import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import TrackingOptionsScroll from '@/components/trackingButtons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import EmergencyButton from '@/components/emergencyButton';
import TodaySchedule from '@/components/todaySchedule';
import { StatusBar } from 'expo-status-bar';

const headerImages = [
  require('@/assets/images/homeSplash/firewatch_tower.webp'),
  require('@/assets/images/homeSplash/river_boat.webp'),
  require('@/assets/images/homeSplash/zen_garden.webp'),
];

export default function HomeScreen() {
  const { getProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [headerImage, setHeaderImage] = useState(headerImages[0]);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getProfile();
      if (profile) {
        setUsername(profile.fName);
      }
    };

    const selectRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * headerImages.length);
      setHeaderImage(headerImages[randomIndex]);
    };

    loadProfile();
    selectRandomImage();
  }, []);

  const greeting = getGreeting(username);

  return (
    <View style={styles.container}>
      <StatusBar translucent />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={headerImage || require('@/assets/images/homeSplash/firewatch_tower.webp')}
          style={styles.header}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <Text style={styles.greeting}>
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
    marginBottom: 70,
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
    fontSize: 30,
    color: 'white',
    fontFamily: theme.fonts.ubuntu.bold,
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 50,
    right: 16,
  }
});