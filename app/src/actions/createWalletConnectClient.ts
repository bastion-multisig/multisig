import WalletConnectClient from '@walletconnect/client';
export async function createWalletConnectClient() {
  console.log("project id", process.env.NEXT_PUBLIC_PROJECT_ID)
  return await WalletConnectClient.init({
    controller: true,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    relayUrl: process.env.REACT_APP_RELAY_URL ?? 'wss://relay.walletconnect.com',
    metadata: {
      name: 'React Wallet',
      description: 'React Wallet for WalletConnect',
      url: 'https://walletconnect.com/',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    }
  })
}
