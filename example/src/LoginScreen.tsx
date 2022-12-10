import React, {useState, useContext} from 'react';
import {StyleSheet, View, Button, Alert} from 'react-native';
import AppwriteOauth from 'react-native-appwrite-oauth';

import appwriteAccount from './sdk';
import AuthContext from './AuthContext';

const LoginScreen: React.FC = () => {
  const [oauthAuthenticating, setOauthAuthenticating] = useState(false);
  const [provider, setProvider] = useState('facebook');
  const [scopes, setScopes] = useState<string[]>([]);
  const authContext = useContext(AuthContext);

  const handleSuccess = (): void => {
    setOauthAuthenticating(false);
    authContext.signIn();
  };

  const handleFailure = (error: string): void => {
    setOauthAuthenticating(false);
    Alert.alert('OAuth Sign In', error);
  };

  return (
    <View style={styles.screen}>
      <AppwriteOauth
        authenticating={oauthAuthenticating}
        provider={provider}
        scopes={scopes}
        account={appwriteAccount}
        onSuccess={handleSuccess}
        onFailure={handleFailure}
      />
      <View style={styles.button}>
        <Button
          title="Facebook Sign In"
          onPress={() => {
            setProvider('facebook');
            setScopes([]);
            setOauthAuthenticating(true);
          }}
        />
      </View>
      <View style={styles.button}>
        <Button
          title="Github Sign In"
          onPress={() => {
            setProvider('github');
            setScopes(['user:email']);
            setOauthAuthenticating(true);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  button: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  header: {
    padding: 10,
  },
});

export default LoginScreen;
