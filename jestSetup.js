/* eslint-disable no-undef */
jest.mock('@react-native-cookies/cookies', () => {
  return {
    setFromResponse: jest.fn().mockResolvedValue(true),
  };
});
/* eslint-enable no-undef */
