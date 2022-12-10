import React from 'react';
import CookieManager from '@react-native-cookies/cookies';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Client, Account } from 'appwrite';
import { create, act, ReactTestRenderer } from 'react-test-renderer';

import AppwriteOauth, { ModalLayoutProps } from '../index';

let tree: ReactTestRenderer;
let client: Client;
let account: Account;

beforeAll(() => {
  client = new Client();
  account = new Account(client);

  client.setEndpoint(`https://localhost/v1`).setProject('testproject');
});

test('Renders correctly.', async () => {
  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={false}
        provider="testprovider"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Renders the WebView and a loading wheel once it starts authenticating.', () => {
  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={false}
        provider="testprovider"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();

  act(() => {
    tree.update(
      <AppwriteOauth
        authenticating={true}
        provider="testprovider"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Allows to change the color of the loading wheel.', async () => {
  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="testprovider"
        loadingColor="rgb(0, 0, 0)"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Re-renders upon a change in provider reflecting the right provider in the url.', () => {
  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();

  act(() => {
    tree.update(
      <AppwriteOauth
        authenticating={true}
        provider="github"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Re-renders upon a change in scopes reflecting the right scopes in the url.', () => {
  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();

  act(() => {
    tree.update(
      <AppwriteOauth
        authenticating={true}
        provider="github"
        scopes={['user:email']}
        account={account}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Renders an user-defined layout instead of the standard one if one is passed.', () => {
  const Layout: React.ComponentType<ModalLayoutProps> = ({
    WebViewComponent,
  }) => (
    <View data-testId="test-webview">
      <WebViewComponent />
    </View>
  );

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        modalLayout={Layout}
      />
    );
  });

  expect(tree.toJSON()).toMatchSnapshot();
});

test('Accepts passing customised user-defined cookie data', async () => {
  let data = '';
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(
    (_, cookieData) => {
      data = cookieData;
      return Promise.resolve(true);
    }
  );

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        cookieData="Test;HttpOnly"
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView);
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success?key=thekey&secret=thesecret',
    });
  });

  expect(data).toBe('thekey=thesecret; Test;HttpOnly');
});

test('Includes HttpOnly in the user-defined cookie data, even if omitted', async () => {
  let data = '';
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(
    (_, cookieData) => {
      data = cookieData;
      return Promise.resolve(false);
    }
  );

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        cookieData="Test"
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView);
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success?key=thekey&secret=thesecret',
    });
  });

  expect(data).toBe('thekey=thesecret; HttpOnly; Test');
});

test('Calls the passed success callback if the url meets the requirements and the cookie is set correctly', async () => {
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(() =>
    Promise.resolve(true)
  );

  const successCallback = jest.fn();
  const failureCallback = jest.fn();

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        onSuccess={successCallback}
        onFailure={failureCallback}
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView);
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success?key=thekey&secret=thesecret',
    });
  });

  expect(successCallback).toHaveBeenCalled();
  expect(failureCallback).not.toHaveBeenCalled();
});

test('Calls the passed failure callback if the url meets the requirements but the cookie is not correctly set by rejection', async () => {
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(() =>
    Promise.reject({ message: 'Promise rejected' })
  );

  const successCallback = jest.fn();
  const failureCallback = jest.fn();

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        onSuccess={successCallback}
        onFailure={failureCallback}
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView); //.find('RNCWebView');
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success?key=thekey&secret=thesecret',
    });
  });

  expect(successCallback).not.toHaveBeenCalled();
  expect(failureCallback).toHaveBeenCalled();
});

test('Calls the passed failure callback if the url meets the requirements but the cookie is not correctly set by error', async () => {
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(
    () =>
      new Promise(() => {
        throw new Error('Error on promise');
      })
  );

  const successCallback = jest.fn();
  const failureCallback = jest.fn();

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        onSuccess={successCallback}
        onFailure={failureCallback}
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView); //.find('RNCWebView');
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success?key=thekey&secret=thesecret',
    });
  });

  expect(successCallback).not.toHaveBeenCalled();
  expect(failureCallback).toHaveBeenCalled();
});

test('Does not call any of the passed callbacks if the url does not meet the requirements', async () => {
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(() =>
    Promise.resolve(true)
  );

  const successCallback = jest.fn();
  const failureCallback = jest.fn();

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        onSuccess={successCallback}
        onFailure={failureCallback}
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView); //.find('RNCWebView');
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success',
    });
  });

  expect(successCallback).not.toHaveBeenCalled();
  expect(failureCallback).not.toHaveBeenCalled();
});

test('Does not call any of the passed callbacks if the cookie is not set properly', async () => {
  (CookieManager.setFromResponse as jest.Mock).mockImplementation(() =>
    Promise.resolve(false)
  );

  const successCallback = jest.fn();
  const failureCallback = jest.fn();

  act(() => {
    tree = create(
      <AppwriteOauth
        authenticating={true}
        provider="facebook"
        scopes={[]}
        account={account}
        onSuccess={successCallback}
        onFailure={failureCallback}
      />
    );
  });

  await act(async () => {
    const webView = tree.root.findByType(WebView); //.find('RNCWebView');
    await webView.props.onShouldStartLoadWithRequest({
      url: 'http://localhost/auth/oauth2/success',
    });
  });

  expect(successCallback).not.toHaveBeenCalled();
  expect(failureCallback).not.toHaveBeenCalled();
});
