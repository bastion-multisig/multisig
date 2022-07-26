import { SmartWalletTransactionData } from "@bastion-multisig/multisig-tx";
import { ProgramAccount } from "@project-serum/anchor";
import { TransactionGroupEntry } from "./TransactionGroupEntry";

export function TransactionGroup({
  header,
  transactions,
}: {
  header: "Transaction Queue" | "Transaction History";
  transactions: ProgramAccount<SmartWalletTransactionData>[];
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>{header}</th>
          <th>{header === "Transaction Queue" ? "ID" : "Time Proposed"}</th>
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
