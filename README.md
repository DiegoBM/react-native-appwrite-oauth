# react-native-appwrite-oauth

React Native component that implements the OAuth2 flow for the Appwrite BaaS (Backend-as-a-Service). It's based in a Modal implementation containing a WebView, that will be used to authenticate against OAuth providers, and internally uses an instance of the [Appwrite Web SDK](https://github.com/appwrite/sdk-for-web) passed to the component via props.

## Installation

```sh
npm install react-native-appwrite-oauth
```

React native Appwrite OAuth depends on the libraries [`appwrite`](https://github.com/appwrite/sdk-for-web), [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) and [`@react-native-cookies/cookies`](https://github.com/react-native-cookies/cookies). These dependencies are marked as peer dependencies, and need to be fullfilled before using the component. If you were **already using them** in your project, then you are good to go, otherwise please run:

```sh
npm install appwrite, react-native-webview, @react-native-cookies/cookies
```

## Basic Usage

In order to use the component, you will need to wrap your code with the `react-native-appwrite-oauth` component as shown below:

```js
import AppwriteOauth from 'react-native-appwrite-oauth';

// ...

// Init your Web SDK
const sdk = new Appwrite();
sdk.setEndpoint(ENDPOINT).setProject(PROJECT);

// ...

const YourOAuthSigninComponent = () => {
  const [authenticating, setAuthenticating] = useState(false);

  const handleSuccess = () {
    // End OAuth sign in and close the modal
    setAuthenticating(false);
    // OAuth Sign in successful.
    // Do something here like navigation to a protected screen
  };

  const handleFailure = (error) => {
    // End OAuth sign in and close the modal
    setAuthenticating(false);
    Alert.alert('OAuth Sign In', error);
  };

  return (
    <View>
      <AppwriteOauth
        authenticating={authenticating}
        provider="facebook"
        scopes={[]}
        sdk={sdk}
        onSuccess={handleSuccess}
        onFailure={handleFailure}
      >
        {/* Implement your component here. Example below */}
        <View>
          <Button
            title="Facebook Sign In"
            onPress={() => {
              // starts OAuth Sign in
              setAuthenticating(true);
            }}
          />
        </View>
      </AppwriteOauth>
    </View>
  );
};
```

## Using a Custom Header

Even though the component already provides you with a button to cancel the OAuth sign in process, you can **optionally** implement your own custom header for the same purpose or any other:

```js
// ...

const CustomHeader = () => (
  <View style={{ padding: 10 }}>
    <Button title="Back" onPress={() => handleFailure('Cancelled')} />
  </View>
);

return (
  <View>
    <AppwriteOauth
      authenticating={authenticating}
      provider="facebook"
      scopes={[]}
      sdk={sdk}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      header={CustomHeader}
    >
      {/* Implement your component here.*/}
    </AppwriteOauth>
  </View>
);

// ...
```

## Example

You can find a complete react native example that implements the entire OAuth2 flow (including navigation with [React Navigation](https://reactnavigation.org)), in the "**example**" folder. Feel free to use it as a reference.

In order run the example, after cloning this repository, you will need to install all the dependencies by running:

```sh
yarn
```

Then open the file `example/src/sdk.ts` and provide the values for `setEndpoint` and `setProject` pointing to your respective Appwrite API server and project.

```js
const sdk = new Appwrite();
// Fill with your Appwrite API endpoint and Project ID!
sdk.setEndpoint('http://localhost/v1').setProject('123456789');
```

Finally run the code in your desired platform, using one of the following commands.

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

## Props

- **`authenticating`** _(Boolean - **Mandatory**)_ - Once you set this property to true, the modal will be displayed and the OAuth process will begin. Please bear in mind that the modal will keep being displayed until you set this property back to false. A normal flow will set this property back to false upon `success` or `failure`, but you are free to implement the flow that best suits your application.

- **`provider`** _(String - **Mandatory**)_ - OAuth provider string, as accepted by the Appwrite SDK. Please check the [Appwrite SDK documentation](https://appwrite.io/docs/client/account#accountCreateOAuth2Session) for a list of supported providers. Example: `'facebook'`

- **`scopes`** _(String Array - **Mandatory**)_ - A list of custom OAuth2 scopes. Check each provider internal docs for a list of supported scopes. Example: `['user:email']` // Github sign in scopes

- **`sdk`** _(Appwrite - **Mandatory**)_ - Appwrite SDK instance, properly configured.

- **`cookieData`** _(String - **Optional**)_ - String representing additional data that you might want to set with your authorization cookie. It needs to follow the same [syntax of a Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) header sent by a server. It's default value, if no value is passed is `'path=/; HttpOnly'`. Please bear in mind that even if you don't include `HttpOnly`, the component will automatically include it. Example: `'Max-Age=2592000; Expires=Wed, 21 Oct 2015 07:28:00 GMT'`.

- **`header`** _(React.ComponentType - **Optional**)_ - Optional React component that allows the user to implement a custom header on top of the WebView used for the OAuth flow, and typically used to cancel the OAuth Sign in. The default Header provided by the component displays a `Cancel` button, that once clicked will call the `onFailure` callback with a `'User cancelled'` message. This component will receive 2 props `onSuccess` and `onFailure`, equivalent to the ones described below.

- **`onSuccess`** _(Function - **Optional**)_ - Callback function that will be executed upon a successful OAuth sign in. It's signature is `() => void`.

- **`onFailure`** _(Function - **Optional**)_ - Callback function that will be executed upon a failed OAuth sign in. It's signature is `(error: string) => void`.

## Remarks

- This component has been tested on Android only. If you experience issues using iOS devices and want to contribute with their fixes, I'll be happy to include them in.

- This component has been tested with `Facebook` and `Github` providers only, but it should work the same with all the other providers supported by Appwrite. Technically the same flow should apply to any other providers unless otherwise specified by the Appwrite team. If you experience any issues with any other provider, please check the logs on your Appwrite installation and see if it reveals important information.

- If you use the standard Appwrite development installation that includes an untrusted **SSL certificate**, the WebView will fail to navigate to your Appwrite server under https, and unfortunately many OAuth providers such as `Facebook` will require the requests to come from/to https domains. So far the only way that I have found to overcome this problem during development, is to disable the native Ssl handling. For `Android` this would entail modifying the file `node_modules\react-native-webview\android\src\main\java\com\reactnativecommunity\webview\RNCWebViewManager.java` by commenting the entire code of the `onReceivedSslError` method, and replacing it with `handler.proceed();`, as described below. Since I can't test in `iOS` I don't know the steps to do the same there, but feel free to let me know and I will include them here. Also, if you know of a better way of dealing with this WebView issue, please let me know and I will include it here. Needless to say, this **will not** be necessary if your environment already has a trusted SSL certificate, or the OAuth provider that you need to use does not require requests coming from https endpoints.

```java
@Override
public void onReceivedSslError(final WebView webView, final SslErrorHandler handler, final SslError error) {
  handler.proceed();
  /*
    // onReceivedSslError is called for most requests, per Android docs: https://developer.android.com/reference/android/webkit/WebViewClient#onReceivedSslError(android.webkit.WebView,%2520android.webkit.SslErrorHandler,%2520android.net.http.SslError)
    // WebView.getUrl() will return the top-level window URL.
    // If a top-level navigation triggers this error handler, the top-level URL will be the failing URL (not the URL of the
    ....
    ....
    ....
  */
}
```

- For the same reason, if you find that the OAuth process completes successfully using https in the Appwrite SDK configuration, but your subsequent requests to the SDK fail to execute, it's likely because the requests are being rejected due to the untrusted certificate. The only way that I have found to solve this during development using the default untrusted certificate, is to complete the OAuth process using https so that the OAuth providers don't complain, and then switch to http for all subsequent requests to Appwrite server, as described below. Again, this **will not** happen if your environment is already using a trusted certificate, or the OAuth provider that you need to use does not require requests coming from https endpoints. If you know of a better way of dealing with this, please let me know and I will include it here.

```js
// Init your Web SDK with https and complete the OAuth sign in
const sdk = new Appwrite();
sdk.setEndpoint('https://localhost/v1').setProject('123456789');

// ...

// Once the OAuth Sign in has completed successfully,
// switch to http and continue using the SDK
sdk.setEndpoint(`http://localhost/v1`);
const accountData = await sdk.account.get();
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
