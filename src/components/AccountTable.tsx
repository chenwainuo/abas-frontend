import { FC } from 'react';

import { PublicKey } from '@solana/web3.js';

import { PositionUiRow } from '../models/types';

export type ButlerTableRow = {};

export type AccountTableProps = {
  show: boolean;
  mangoAccount: PublicKey;
  butlerAccountOwner: PublicKey;
  rows: Array<PositionUiRow>;
};

export const AccountTable: FC<AccountTableProps> = (props) => {
  if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
    return <div></div>;
  }

  if (props.rows.length === 0) {
    return (
      <div>
        <div>
          {' '}
          👀 Abas keeper is working hard to get a good price entry for you,
          patience is a virtue! <br />{' '}
        </div>
        <div>
          {' '}
          Meanwhile drop by our{' '}
          <a href={'http://discord.gg/4rNmEWNZU5'}>Discord</a> and say hi!{' '}
        </div>
      </div>
    );
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Market</th>
            <th>Drift Position</th>
            <th>Mango Position</th>
            <th>Drift est. FR</th>
            <th>Mango est. FR</th>
            <th>est. 1H FR Revenue</th>
            <th>est. APR</th>
          </tr>
        </thead>
        <tbody>
          {props.rows
            .sort((a, b) => {
              return (a.estApr.valueOf() - b.estApr.valueOf()) * -1;
            })
            .map((row) => {
              return (
                <tr>
                  <td>{row.marketNamePerp}</td>
                  <td>{row.driftBase}</td>
                  <td>{row.mangoBase}</td>
                  <td>{row.driftFundingRate.toFixed(2)}%</td>
                  <td>{row.mangoFundingRate.toFixed(2)}%</td>
                  <td>${row.estFundingRev.toFixed(2)}</td>
                  <td>{row.estApr.toFixed(2)}%</td>
                </tr>
              );
            })}
          <tr>
            <td>Total</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              $
              {props.rows
                .map((p) => p.estFundingRev)
                .reduce((a, b) => +a + +b, 0)
                .toFixed(2)}
            </td>
            <td>
              {props.rows
                .map((p) => p.estApr)
                .reduce((a, b) => +a + +b, 0)
                .toFixed(2)}
              %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
