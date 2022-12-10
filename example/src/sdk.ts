import {Client, Account} from 'appwrite';

const client = new Client();
const account = new Account(client);

// Fill with your Appwrite API endpoint and Project ID!
client.setEndpoint('').setProject('');

export default account;
