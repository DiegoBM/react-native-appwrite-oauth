import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Button,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView, WebViewProps } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';

import type { Appwrite } from 'appwrite';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';

type onSuccessCallback = () => void;
type onFailureCallback = (message: string, failureData?: unknown) => void;
type setLoadingStateCallback = (showLoading: boolean) => void;

export type ModalLayoutProps = {
  WebViewComponent: React.ComponentType<any>;
  setLoadingState: setLoadingStateCallback;
  onSuccess: onSuccessCallback;
  onFailure: onFailureCallback;
};

// Default layout used by the component. Not to be exposed. Can be overriden.
const DefaultLayout: React.FC<ModalLayoutProps> = ({
  WebViewComponent,
  setLoadingState,
  onFailure,
}) => {
  const handleCancel = () => {
    setLoadingState(false);
    onFailure('User cancelled');
  };

  return (
    <>
      <Button title="Cancel" onPress={handleCancel} />
      <WebViewComponent />
    </>
  );
};

export type AppwriteOauthProps = {
  /**
   * Appwrite SDK instance
   */
  sdk: Appwrite;

  /**
   * Initiates the authentication process
   */
  authenticating: boolean;

  /**
   * OAuth provider string, as accepted by the Appwrite SDK.
   *
   * For a list of supported providers, see https://appwrite.io/docs/client/account#accountCreateOAuth2Session
   */
  provider: string;

  /**
   * A list of custom OAuth2 scopes. Check each provider internal docs for a list of supported scopes.
   *
   * @default []
   */
  scopes?: string[];

  /**
   * String representing additional data that you might want to set with your authorization cookie.
   *
   * It needs to follow the Set-Cookie format. See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
   * @default 'path=/; HttpOnly'
   */
  cookieData?: string;

  /**
   * Color of the spinning wheel indicating the loading state inside the modal.
   *
   * It needs to be a alid React Native color value like 'rgb(0,0,0)' or '#ffffff'.
   * @default '#206fce'
   */
  loadingColor?: string;

  /**
   * Optional custom layout component describing the contents of the modal.
   *
   * It receives as props the WebViewComponent, onSuccess, onFailure and setLoadingState.
   */
  modalLayout?: React.ComponentType<ModalLayoutProps>;
  /**
   * Callback function that will be executed upon a successful OAuth sign in.
   */
  onSuccess?: onSuccessCallback;
  /**
   * Callback function that will be executed upon a failed OAuth sign in.
   */
  onFailure?: onFailureCallback;
};

const successUrl = 'http://localhost/auth/oauth2/success';
const failureUrl = 'http://localhost/auth/oauth2/failure';
const regex = /http:\/\/localhost(.*)?.+key=(?<key>.+)?&secret=(?<secret>.+)/;

const AppwriteOauth: React.FC<AppwriteOauthProps> = ({
  sdk,
  authenticating = false,
  provider = '',
  scopes = [],
  cookieData = 'path=/; HttpOnly',
  loadingColor = '#206fce',
  onSuccess = () => {},
  onFailure = () => {},
  modalLayout,
}) => {
  if (!sdk) {
    throw new Error('Missing or invalid Appwrite "sdk" prop');
  }

  if (!provider) {
    throw new Error('Missing or invalid Appwrite "provider" prop');
  }

  const [endpoint, setEndpoint] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticating) {
      const url = sdk.account.createOAuth2Session(
        provider,
        successUrl,
        failureUrl,
        scopes
      );
      setEndpoint(url.toString());
      setLoading(true);
    }
  }, [authenticating, sdk, provider, scopes]);

  // Intercept all requests before navigation happens in order to stop the
  // navigation to "localhost", which might not exist, and we don't need to
  // navigate there anyways, once we set the cookie we are as good as done
  // with the webview in react native
  const handleShouldStartLoadWithRequest = useCallback(
    (request: any): boolean => {
      if (!request.url) {
        return false;
      }

      const urlDomain = request.url.split('/').slice(0, 3).join('/');
      const sdkDomain = sdk.config.endpoint.split('/').slice(0, 3).join('/');

      // If we get into one of our urls, indicate loading, since we are redirecting
      // to another state where we will be doing something meaningful. Disable then.
      setLoading(urlDomain === sdkDomain || urlDomain === 'http://localhost');

      const result = (request.url as string).match(regex);
      if (authenticating && result !== null && result.groups) {
        const { key, secret } = result.groups;

        // Ensures that HttpOnly is included in the cookie data
        let cookieString = !cookieData.toLowerCase().includes('httponly')
          ? `HttpOnly; ${cookieData}`
          : cookieData;

        cookieString = `${key}=${secret}; ${cookieString}`;
        CookieManager.setFromResponse(sdkDomain, cookieString)
          .then((success) => {
            // This state change will trigger a re-render immediately since it's
            // happening outside of a react handler (inside a promise)
            setLoading(false);
            if (success) {
              onSuccess();
            } else {
              onFailure('Cookie not set');
            }
          })
          .catch((error) => {
            setLoading(false);
            onFailure(error.message);
          });
        // Do not proceed with navigation
        return false;
      } else {
        // Proceed with navigation
        return true;
      }
    },
    [sdk, authenticating, setLoading, onSuccess, onFailure, cookieData]
  );

  const handleError = useCallback(
    (syntheticEvent: WebViewErrorEvent) => {
      const { nativeEvent } = syntheticEvent;
      setLoading(false);
      // WebView errors send back extra error information to the caller
      onFailure(nativeEvent.description, nativeEvent);
    },
    [setLoading, onFailure]
  );

  const setLoadingState: setLoadingStateCallback = useCallback(
    (showLoading: boolean) => setLoading(showLoading),
    [setLoading]
  );

  let ModalLayout: React.ComponentType<any> = modalLayout
    ? modalLayout
    : DefaultLayout;

  // Protects in case the user pases an un-memoized layout as prop
  ModalLayout = useMemo(() => React.memo(ModalLayout), [ModalLayout]);

  // Dynamically create the WebView component, since we need to have it bound
  // to this component's props, in order to pass it as a prop itself, i.e. we
  // don't know yet where will this be rendered (default layout or outside custom layout)
  const WebViewComponent: React.FC<WebViewProps> = useCallback(
    ({ style = {}, ...rest }) => {
      return authenticating ? (
        <WebView
          style={[styles.fill, style]}
          {...rest}
          source={{ uri: endpoint }}
          onError={handleError}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
      ) : null;
    },
    [endpoint, authenticating, handleError, handleShouldStartLoadWithRequest]
  );

  return (
    <Modal visible={authenticating} animationType="slide">
      <ModalLayout
        WebViewComponent={WebViewComponent}
        onSuccess={onSuccess}
        onFailure={onFailure}
        setLoadingState={setLoadingState}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={loadingColor} />
        </View>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'stretch',
    margin: 0,
    padding: 0,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(AppwriteOauth);
