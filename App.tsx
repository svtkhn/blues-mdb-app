import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Realm, { BSON, ObjectSchema } from 'realm';
import { AppProvider, UserProvider, RealmProvider, useAuth, useQuery } from '@realm/react';

export class Telemetry extends Realm.Object<Telemetry> {
  _id!: BSON.ObjectId;
  humid?: number;
  temp?: number;
  lat?: number;
  lon?: number;

  static schema: ObjectSchema = {
    name: 'telemetry',
    properties: {
      _id: 'objectId',
      humid: 'double?',
      temp: 'double?',
      lat: 'double?',
      lon: 'double?',
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
                    realm.objects(Telemetry).filtered('temp > 0'),
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

function MainPage() {
  const telemetry = useQuery(Telemetry);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.dataContainer}>
          {telemetry.map((item) => (
            <View key={item._id.toString()} style={styles.dataItem}>
              <Text>Temp: {item.temp ?? "N/A"}</Text>
              <Text>Humidity: {item.humid ?? "N/A"}</Text>
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
                title={`Temp: ${item.temp}`}
                description={`Humidity: ${item.humid}`}
              />
            )
          ))}
        </MapView>
      </View>
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
});

export default App;
