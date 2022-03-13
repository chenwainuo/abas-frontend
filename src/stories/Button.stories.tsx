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
  <DepositModal />
);

export const Primary = Template.bind({});
