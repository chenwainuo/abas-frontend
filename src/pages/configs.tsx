import type { NextPage } from "next";
import Head from "next/head";
import {ConfigsView, TokenView} from "../views";

const Configs: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Token Basics"
        />
      </Head>
      <ConfigsView />
    </div>
  );
};

export default Configs;
