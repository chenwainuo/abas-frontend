import { FC } from 'react';

import { AppProps } from 'next/app';

import '../styles/global.css';
import { AppBar } from '@/components/AppBar';
import { ContentContainer } from '@/components/ContentContainer';
import { Footer } from '@/components/Footer';
import { ContextProvider } from '@/contexts/ContextProvider';

import Notifications from '../components/Notification';

require('@solana/wallet-adapter-react-ui/styles.css');

const App: FC<AppProps> = ({ Component, pageProps }: AppProps) => (
  <ContextProvider>
    <div className="flex flex-col h-screen">
      <Notifications />
      <AppBar />
      <ContentContainer>
        <Component {...pageProps} />
      </ContentContainer>
      <Footer />
    </div>
  </ContextProvider>
);

export default App;
