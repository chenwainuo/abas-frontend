import { FC } from 'react';

import { UserConfig } from '@/components/UserConfig';
import { useUserInfoContext } from '@/contexts/UserInfoProvider';

export const ConfigsView: FC = () => {
  const { data, isLoading } = useUserInfoContext();

  if (!data) {
    return <div />;
  }
  if (isLoading) {
    return <div> Loading.... </div>;
  }

  return (
    <div className="p-4 py-4 mx-auto hero min-h-16">
      <div className="flex flex-col max-w-lg hero-content">
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
