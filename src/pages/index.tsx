import { Meta } from '@/layout/Meta';
import { Main } from '@/templates/Main';
import { HomeView } from '@/views';

const Index = () => {
  return (
    <Main meta={<Meta title="Abas Finance" description="description" />}>
      <HomeView />
    </Main>
  );
};

export default Index;
