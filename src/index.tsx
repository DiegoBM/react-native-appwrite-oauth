import React, { useState, useEffect } from 'react';
import { Modal, View, Button, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';

import type { Appwrite } from 'appwrite';

type onSuccessCallback = () => void;
type onFailureCallback = (error: string) => void;

type ModalHeaderProps = {
  onSuccess?: onSuccessCallback;
  onFailure?: onFailureCallback;
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ onFailure }) => {
  return (
    <View>
      <Button
        title="Cancel"
        onPress={() => {
          if (typeof onFailure === 'function') onFailure('User cancelled');
        }}
      />
    </View>
  );
};

export type AppwriteOauthProps = {
  authenticating: boolean;
  provider: string;
  scopes: string[];
  sdk: Appwrite;
  cookieData?: string;
  onSuccess?: onSuccessCallback;
  onFailure?: onFailureCallback;
  header?: React.ComponentType<any>;
  children?: React.ReactNode;
};

const successUrl = `http://localhost/auth/oauth2/success`;
const failureUrl = `http://localhost/auth/oauth2/failure`;
const regex = /http:\/\/localhost(.*)?.+key=(?<key>.+)?&secret=(?<secret>.+)/;

const AppwriteOauth: React.FC<AppwriteOauthProps> = ({
  authenticating = false,
  provider = '',
  scopes = [],
  sdk,
  cookieData = 'path=/; HttpOnly',
  onSuccess,
  onFailure,
  header,
  children,
}) => {
  if (!sdk) throw new Error('Missing Appwrite "sdk" prop');

  const [endpoint, setEndpoint] = useState<string>('');

  useEffect(() => {
    const url = sdk.account.createOAuth2Session(
      provider,
      successUrl,
      failureUrl,
      scopes
    );
    setEndpoint(url.toString());
  }, [sdk, provider, scopes]);

  // Intercept all requests before navigation happens in order to stop the
  // navigation to "localhost", which might not exist, and we don't need to
  // navigate there anyways, once we set the cookie we are as good as done
  // with the webview in react native
  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    if (!request.url) return false;

    const result = (request.url as string).match(regex);
    if (authenticating && result !== null && result.groups) {
      const { key, secret } = result.groups;

      // Ensures that HttpOnly is included in the cookie data
      if (!cookieData.toLowerCase().includes('httponly')) {
        cookieData = `HttpOnly; ${cookieData}`;
      }
      const successCallback =
        typeof onSuccess === 'function' ? onSuccess : () => {};
      const failureCallback =
        typeof onFailure === 'function' ? onFailure : () => {};

      CookieManager.setFromResponse(
        // Obtains the "origin" part of the endpoint url
        sdk.config.endpoint.split('/').slice(0, 3).join('/'),
        `${key}=${secret}; ${cookieData}`
      )
        .then((success) => {
          if (success) successCallback();
          else failureCallback('Cookie not set');
        })
        .catch((error) => {
          if (typeof onFailure === 'function') onFailure(error.message);
        });

      return false;
    } else {
      return true;
    }
  };

  const HeaderComponent: React.ComponentType<any> = header
    ? header
    : ModalHeader;

  return (
    <View style={styles.fill}>
      <Modal visible={authenticating} animationType="slide">
        <HeaderComponent onSuccess={onSuccess} onFailure={onFailure} />
        {authenticating ? (
          <WebView
            style={styles.fill}
            source={{ uri: endpoint }}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          />
        ) : null}
      </Modal>
      {children ? children : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'stretch',
    margin: 0,
    padding: 0,
  },
});

export default AppwriteOauth;
