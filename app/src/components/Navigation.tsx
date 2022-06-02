import { Avatar, Row } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";

export default function Navigation() {
  return (
    <Row justify="space-between" align="center">
      <Link href="/transactionQueue" passHref>
        <a className="navLink">
          <Image
            alt="transaction queue icon"
            src="/icons/transaction-queue-icon.svg"
            width={27}
            height={27}
          />
        </a>
      </Link>

      <Link href="/sessions" passHref>
        <a className="navLink">
          <Image
            alt="sessions icon"
            src="/icons/sessions-icon.svg"
            width={27}
            height={27}
          />
        </a>
      </Link>

      <Link href="/" passHref>
        <a className="navLink">
          <Avatar
            size="lg"
            css={{ cursor: "pointer" }}
            color="gradient"
            icon={
              <Image
                alt="welcome icon"
                src="/icons/welcome-icon.svg"
                width={30}
                height={30}
              />
            }
          />
        </a>
      </Link>

      <Link href="/walletconnect" passHref>
        <a className="navLink">
          <Image
            alt="wallet connect icon"
            src="/wallet-connect-logo.svg"
            width={30}
            height={30}
          />
        </a>
      </Link>

      <Link href="/pairings" passHref>
        <a className="navLink">
          <Image
            alt="pairings icon"
            src="/icons/pairings-icon.svg"
            width={25}
            height={25}
          />
        </a>
      </Link>
    </Row>
  );
}
