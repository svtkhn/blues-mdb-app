import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Realm, { BSON, ObjectSchema } from 'realm';
import { AppProvider, UserProvider, RealmProvider, useAuth, useQuery, useUser } from '@realm/react';

export class Telemetry extends Realm.Object<Telemetry> {
  _id!: BSON.ObjectId;
  device!: string;
  lat!: number;
  lon!: number;
  orientation!: string;
  timestamp!: Date;

  static schema: ObjectSchema = {
    name: 'telemetry',
    properties: {
      _id: 'objectId',
      device: 'string',
      lat: 'double',
      lon: 'double',
      orientation: 'string',
      timestamp: 'date',
    },
    primaryKey: '_id',
  };
}

export const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppProvider id="blues-usgtaqh">
        <UserProvider fallback={LoginComponent}>
          <RealmProvider schema={[Telemetry]}
            sync={{
              flexible: true,
              initialSubscriptions: {
                update: (mutableSubs, realm) => {
                  mutableSubs.add(
                    realm.objects(Telemetry),
                  );
                },
              },
              onError: (session, error) => {
                console.error(error.message);
              },
            }}>
            <MainPage />
          </RealmProvider>
        </UserProvider>
      </AppProvider>
    </SafeAreaView>
  );
};

function ToggleDevice() {
  const user = useUser();
  const [isEnabled, setIsEnabled] = useState(true);

  const toggleSwitch = async () => {
    setIsEnabled(previousState => !previousState);

    try {
      if (isEnabled) {
        await user?.callFunction('disable_device');
      } else {
        await user?.callFunction('enable_device');
      }
    } catch (error) {
      console.error('Failed to enable device:', error);
    }
  };

  return (
    <View style={[
      // styles.container,
      {
        // Try setting `flexDirection` to `"row"`.
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10
      },
    ]}>
      <Text>Device Enabled:</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  )
}

function MainPage() {
  const telemetry = useQuery(Telemetry);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.dataContainer}>
          {telemetry.map((item) => (
            <View key={item._id.toString()} style={styles.dataItem}>
              <Text>device: {item.device ?? "N/A"}</Text>
              <Text>orientation: {item.orientation ?? "N/A"}</Text>
              <Text>Lat: {item.lat ?? "N/A"}</Text>
              <Text>Lon: {item.lon ?? "N/A"}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: telemetry[0]?.lat ?? 37.78825,
            longitude: telemetry[0]?.lon ?? -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {telemetry.map((item) => (
            item.lat && item.lon && (
              <Marker
                key={item._id.toString()}
                coordinate={{ latitude: item.lat, longitude: item.lon }}
                title={`orientation: ${item.orientation}`}
                description={`orientation: ${item.orientation}`}
              />
            )
          ))}
        </MapView>
      </View>
      <ToggleDevice></ToggleDevice>
    </View>
  );
}

const LoginComponent = () => {
  const { logInWithAnonymous, result } = useAuth();

  return (
    <View style={styles.loginContainer}>
      <Pressable onPress={logInWithAnonymous} style={styles.loginButton}>
        <Text style={styles.loginText}>Log In</Text>
      </Pressable>
      {result.error && <Text style={styles.errorText}>{result.error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  dataContainer: {
    padding: 10,
  },
  dataItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: 'red',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default App;
