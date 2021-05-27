import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';

import sdk from './sdk';
import AuthContext from './AuthContext';

const defaultMessage = 'No account data to show';

const AccountScreen: React.FC = () => {
  const [account, setAccount] = useState<null | any>(null);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    const getAccount = async () => {
      try {
        const accountData = await sdk.account.get();
        setAccount(accountData);
      } catch (error) {
        Alert.alert('Error Retrieving Account', error.message);
      }
    };

    getAccount();
  }, []);

  const handleLogout = async () => {
    try {
      await sdk.account.deleteSession('current');
      authContext.signOut();
    } catch (error) {
      Alert.alert('Error Signing Out', error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Your Account Information</Text>
      <Text style={styles.account}>
        {account ? JSON.stringify(account) : defaultMessage}
      </Text>
      <Button title="Sign Out" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    borderBottomColor: 'black',
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  account: {
    marginBottom: 20,
  },
});

export default AccountScreen;
