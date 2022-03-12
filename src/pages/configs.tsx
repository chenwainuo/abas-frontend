import type { NextPage } from 'next';

import { Meta } from '@/layout/Meta';
import { Main } from '@/templates/Main';
import { ConfigsView } from '@/views/configs';

const Configs: NextPage = (props) => {
  return (
    <Main
      meta={
        <Meta title="Abas Finance" description="Abas Finance configuration" />
      }
    >
      <ConfigsView />
    </Main>
    // <div>
    // <Head>
    // <title>Abas Finance</title>
    // <meta name="description" content="Token Basics" />
    // </Head>
    // </div>
  );
};

export default Configs;
