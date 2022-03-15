import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

import { Meta } from '@/layout/Meta';
import { Main } from '@/templates/Main';
import { HomeView } from '@/views/home';

const client = new ApolloClient({
  uri: 'https://decent-badger-58.hasura.app/v1/graphql',
  cache: new InMemoryCache(),
});

const Index = () => {
  return (
    <Main meta={<Meta title="Abas Finance" description="description" />}>
      <ApolloProvider client={client}>
        <HomeView />
      </ApolloProvider>
    </Main>
  );
};

export default Index;
