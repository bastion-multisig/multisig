import { SmartWalletTransactionData } from "@bastion-multisig/multisig-tx";
import { ProgramAccount } from "@project-serum/anchor";
import { TransactionGroupEntry } from "./TransactionGroupEntry";

export function TransactionGroup({
  header,
  transactions,
}: {
  header: string;
  transactions: ProgramAccount<SmartWalletTransactionData>[];
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>{header}</th>
          <th>Time Proposed</th>
          <th>Token</th>
          <th>Signatures</th>
          <th>Amount</th>
        </tr>
      </thead>
      {transactions.map((tx) => (
        <TransactionGroupEntry transaction={tx} />
      ))}
    </table>
  );
}
