import { FC } from 'react';

import { useUserInfoContext } from '@/contexts/UserInfoProvider';

import { UserConfig } from '../../components/UserConfig';

export const ConfigsView: FC = () => {
  const { data, isLoading } = useUserInfoContext();

  if (!data) {
    return <div />;
  }
  if (isLoading) {
    return <div> Loading.... </div>;
  }

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Abas
        </h1>
        {/* CONTENT GOES HERE */}
        <div className="p-2 text-center">
          <UserConfig
            {...{
              isLoading,
              mangoAccount: data.mangoAccount,
              butlerAccountOwner: data.butlerAccountOwner,
              userConfig: data.userConfig,
              show: data.accountInitialized,
            }}
          />
        </div>
      </div>
    </div>
  );
};
