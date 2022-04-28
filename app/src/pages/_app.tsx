import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { ContextProviders } from "../contexts/ContextProviders";
import { AppBar } from '../components/AppBar';
import { ContentContainer } from '../components/ContentContainer';
import { Footer } from '../components/Footer';

require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    return (
      <>
        <Head>
          <title>Solana Scaffold Lite</title>
        </Head>

        <ContextProviders>
          <div className="flex flex-col h-screen">
            <AppBar />
            <ContentContainer>
              <Component {...pageProps} />
            </ContentContainer>
            <Footer />
          </div>
        </ContextProviders>
      </>
    );
};

export default App;
