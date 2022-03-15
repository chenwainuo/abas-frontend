import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import { DepositModal } from '@/components/DespositModal';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Button',
  component: DepositModal,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof DepositModal>;

const Template: ComponentStory<typeof DepositModal> = (args) => (
  <DepositModal {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  usdcBalannce: 10000,
  depositLimit: 6000,
  currentColateral: 3000,
};
