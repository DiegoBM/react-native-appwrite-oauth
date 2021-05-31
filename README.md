# react-native-appwrite-oauth

React Native component that implements the OAuth2 flow for the Appwrite BaaS (Backend-as-a-Service). It's based in a Modal implementation containing a WebView, that will be used to authenticate against OAuth providers, and internally uses an instance of the [Appwrite Web SDK](https://github.com/appwrite/sdk-for-web) passed to the component via props.

## Installation

```sh
npm install react-native-appwrite-oauth
```

React Native Appwrite OAuth depends on the libraries [`appwrite`](https://github.com/appwrite/sdk-for-web), [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) and [`@react-native-cookies/cookies`](https://github.com/react-native-cookies/cookies). These dependencies are marked as peer dependencies, and need to be fullfilled before using the component. If you were **already using them** in your project, then you are good to go, otherwise please run:

```sh
npm install appwrite react-native-webview @react-native-cookies/cookies
```

## Basic Usage

In order to use the component, you just need to place it anywhere in your screen, as shown below:

```js
import AppwriteOauth from 'react-native-appwrite-oauth';

// ...

// Init your Web SDK
const sdk = new Appwrite();
sdk.setEndpoint(ENDPOINT).setProject(PROJECT);

// ...

const YourOAuthSigninComponent = () => {
  const [authenticating, setAuthenticating] = useState(false);

  const handleSuccess = () => {
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
        sdk={sdk}
        authenticating={authenticating}
        provider="facebook"
        onSuccess={handleSuccess}
        onFailure={handleFailure}
      />
      <Button
        title="Facebook Sign In"
        onPress={() => {
          // Start OAuth Sign in
          setAuthenticating(true);
        }}
      />
    </View>
  );
};

// ...
```

## Using a Custom Layout

By default, the component displays within the modal, a layout composed of a _Cancel_ button, and a WebView to perform the OAuth flow over the web. In this default layout, when you click the _Cancel_ button, the **onFailure** callback will be called with a _'User cancelled'_ message.

If for some reason you need more control on what gets displayed inside the modal component, you need to display more components besides the Button and the WebView, or simply render the WebView above a _"Back"_ button, you can pass your own layout as a React Component Type in the `modalLayout` prop.

As usual, please **_make sure_** to provide enough space through styles, for the content of the modal to be seen. In many cases, if you were not able to see the contents of the WebView might have been because the container View was not taking enough space in the screen.

```js
// ...

const MyLayout = ({ WebViewComponent }) => (
  <View>
    <Button title="Cancel" onPress={() => handleFailure('User cancelled')} />
    <WebViewComponent />
    <Button title="Force Success" onPress={() => handleSuccess()} />
  </View>
);

// ...

return (
  <View>
    <AppwriteOauth
      sdk={sdk}
      authenticating={authenticating}
      provider="github"
      scopes={['user:email']}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      modalLayout={MyLayout}
    />
    <Button title="Github Sign In" onPress={() => setAuthenticating(true)} />
  </View>
);

// ...
```

## Example

You can find a complete react native example that implements the entire OAuth2 flow (including navigation with [React Navigation](https://reactnavigation.org)), in the "**example**" folder. Feel free to use it as a reference.

In order to run the example, after cloning this repository, you will need to install all the dependencies by running:

```sh
yarn
```

Then open the `example/src/sdk.ts` file, and provide the values for `setEndpoint` and `setProject`, pointing to your respective Appwrite API server and project.

```js
const sdk = new Appwrite();
// Fill with your Appwrite API endpoint and Project ID!
sdk.setEndpoint('http://localhost/v1').setProject('123456789');
```

Finally run the code in your desired platform, using one of the following commands:

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

## Props

- **`sdk`** _(Appwrite - **Mandatory**)_ - Appwrite SDK instance, which needs to be properly configured before using the component.

- **`authenticating`** _(Boolean - **Mandatory**)_ - Once you set this property to true, the modal will be displayed and the OAuth process will begin. Please bear in mind that the modal will keep being displayed until you set this property back to false. A normal flow will set this property back to false upon `success` or `failure`, but you are free to implement the flow that best suits your application.

- **`provider`** _(String - **Mandatory**)_ - OAuth provider string, as accepted by the Appwrite SDK. Please check the [Appwrite SDK documentation](https://appwrite.io/docs/client/account#accountCreateOAuth2Session) for a list of supported providers. Example: `'facebook'`

- **`scopes`** _(String Array - **Optional**)_ - A list of custom OAuth2 scopes. Check each provider internal docs for a list of supported scopes. If no value is passed, an empty array will be sent as default. Example: `['user:email']` // Github sign in scopes

- **`cookieData`** _(String - **Optional**)_ - String representing additional data that you might want to set with your authorization cookie. It needs to follow the same [syntax of a Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) header sent by a server. Its default value, if no value is passed is `'path=/; HttpOnly'`. Please bear in mind that even if you don't include `HttpOnly`, the component will automatically include it. Example: `'Max-Age=2592000; Expires=Wed, 21 Oct 2015 07:28:00 GMT'`.

- **`loadingColor`** _(String - **Optional**)_ - Valid React Native color value, that will represent the color of the spinning wheel indicating the loading state inside the modal. Its default value is `'#206fce'`. Example: `'rgb(0, 0, 10)'`.

- **`modalLayout`** _(React.ComponentType - **Optional**)_ - Optional custom layout component, that specifies how the OAuth WebView (among any other components that you might wish to add), will be rendered inside the modal window. The component passed will receive four props:

  - **`WebViewComponent`** _(WebView)_ Component, that represents the OAuth webview. Most of the characteristic **WebView** props that you pass to this component, will be passed directly to the internal WebView. In order to not interfere with the correct OAth flow, the only ones that will not be passed are `source`, `onError` and `onShouldStartLoadWithRequest`.
  - **`setLoadingState`** _(Function)_ Controls the loading state inside the modal. If the value passed is true, it will display a spinning wheel overlaying the modal content, otherwise if the value passed is false, it will hide it. Signature: `(showLoading: boolean) => void`.
  - **`onSuccess`** _(Function)_ Callback function that will be executed upon a successful OAuth sign in. Equivalent to the one described below. Signature: `() => void`.
  - **`onFailure`** _(Function)_ Callback function that will be executed upon a failed OAuth sign in. Equivalent to the one described below. Signature: `(message: string, failureData: unknown) => void`.

- **`onSuccess`** _(Function - **Optional**)_ - Callback function that will be executed upon a successful OAuth sign in. Signature: `() => void`.

- **`onFailure`** _(Function - **Optional**)_ - Callback function that will be executed upon a failed OAuth sign in. It will receive a message with a short description of the error. Additionally, it might receive extended error information in `failureData` if the triggering error provides that extra information. Signature: `(message: string, failureData: unknown) => void`.

## Remarks

- This component has been tested on Android only. If you experience issues using iOS devices and want to contribute with their fixes, I'll be happy to include them in.

- This component has been tested with `Facebook` and `Github` providers only, but it should work the same with all the other providers supported by Appwrite. Technically the same flow should apply to any other providers unless otherwise specified by the Appwrite team. If you experience any issues with any other provider, please check the logs on your Appwrite installation and see if it reveals important information.

- If you use the standard Appwrite development installation that includes an untrusted **SSL certificate**, the WebView will fail to navigate to your Appwrite server under https, and unfortunately many OAuth providers such as `Facebook` will require the requests to come from/to https domains (other providers like `Github` haven't made this a requirement yet). So far the only way that I have found to overcome this problem during development, is to disable the native Ssl handling. For `Android` this would entail modifying the file `node_modules\react-native-webview\android\src\main\java\com\reactnativecommunity\webview\RNCWebViewManager.java` by commenting the entire code of the `onReceivedSslError` method, and replacing it with `handler.proceed();`, as shown below (you will need to rebuild your application after this change). Since I can't test in `iOS` I don't know the steps to do the same there, but feel free to let me know and I will include them here. Also, if you know of a better way of dealing with this WebView issue, please let me know and I will include it here. Needless to say, this **will not** be necessary if your environment already has a trusted SSL certificate, or the OAuth provider that you need to use does not require requests coming from https endpoints.

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

- If you sign in with one provider like _Facebook_, and afterwards you sign in with let's say _Github_, and both accounts share the same email, you'll notice that you'll be getting the account information that was added when you signed up with the first provider. This is **`Appwrite's`** specific implementation. If you reverse the order of the providers that you use to sign up for the first time, you'll see that you'll allways get the account information of the account that you used first. My best guess is that accounts are created using the email as a primary key, and if that email already exists, it will use that account information and move on, so please bear this in mind.

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
