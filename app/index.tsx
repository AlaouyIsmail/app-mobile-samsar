// import { Text, View } from "react-native";

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>ismail alaouy </Text>
//     </View>
//   );
// }

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from './context/AuthContext';
import { COLORS } from './constants/colors';

import GreetingScreen from './screens/Greetingscreen';
import LoginScreen        from './screens/Loginscreen';
import RegisterScreen     from './screens/Registerscreen';
import PaymentScreen      from './screens/Paymentscreen';
import HomeScreen         from './screens/Homescreen';
import PropertiesScreen   from './screens/Propertiesscreen';
import PropertyDetailScreen from './screens/Propertydetailscreen';
import MapScreen          from './screens/Mapscreen';
import AgentDashboardScreen from './screens/Agentdashboardscreen';
import AdminScreen        from './screens/Adminscreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Public home tabs ──────────────────────────────────────────────────────────
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.text3,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            HomeTab:       ['home',        'home-outline'],
            PropertiesTab: ['grid',        'grid-outline'],
            MapTab:        ['map',         'map-outline'],
            AgentTab:      ['person',      'person-outline'],
          };
          const [filled, outline] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? filled : outline) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"       component={HomeScreen}       options={{ title: 'Accueil' }} />
      <Tab.Screen name="PropertiesTab" component={PropertiesScreen} options={{ title: 'Annonces' }} />
      <Tab.Screen name="MapTab"        component={MapScreen}        options={{ title: 'Carte' }} />
      <Tab.Screen name="AgentTab"      component={AgentOrLogin}     options={{ title: 'Espace' }} />
    </Tab.Navigator>
  );
}

// ── Redirect if not logged in ─────────────────────────────────────────────────
function AgentOrLogin({ navigation }: any) {
  const { isAuthenticated, user } = useAuth();
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (user?.role === 'admin') return <AdminScreen navigation={navigation} />;
  return <AgentDashboardScreen navigation={navigation} />;
}

// ── Root Navigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { loading, isAuthenticated, user, hasSeenGreeting } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <View style={styles.splashDot} />
        </View>
        <Text style={styles.splashText}>SAMSAR</Text>
        <ActivityIndicator color={COLORS.teal} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasSeenGreeting ? 'Main' : 'Greeting'}
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#fff' } }}
      >
        {/* Auth screens (always accessible) */}
        <Stack.Screen name="Greeting"  component={GreetingScreen} />
        <Stack.Screen name="Login"     component={LoginScreen} />
        <Stack.Screen name="Register"  component={RegisterScreen} />
        <Stack.Screen name="Payment"   component={PaymentScreen} />

        {/* Main app */}
        <Stack.Screen name="Main"          component={HomeTabs} />
        <Stack.Screen
          name="PropertyDetail"
          component={PropertyDetailScreen}
          options={{ presentation: 'card' }}
        />

        {/* Admin standalone */}
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,15,30,0.07)',
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#0A0F1E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  splash: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  splashDot: { width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.teal },
  splashText: {
    color: '#fff', fontSize: 24, fontWeight: '800',
    letterSpacing: 2, textTransform: 'uppercase',
  },
});