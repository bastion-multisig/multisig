import PageHeader from "@/components/PageHeader";
import {
  Button,
  Card,
  Collapse,
  Divider,
  Input,
  Text,
} from "@nextui-org/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Image from "next/image";
import { Fragment, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Owner {
  key: number;
  address: string;
  pk: PublicKey | undefined;
  valid: boolean;
  required: boolean;
  unique: boolean;
}

export default function CreatePage() {
  const [current, setCurrent] = useState(0);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerKey, setOwnerKey] = useState(0);
  const [threshold, setThreshold] = useState(1);
  const wallet = useWallet();

  function back() {
    setCurrent((current) => Math.max(current - 1, 0));
  }
  function next() {
    if (owners.length === 0 && wallet.publicKey) {
      newOwner();
    }
    setCurrent((current) => Math.min(current + 1, 2));
  }

  function handleAcceptOwners() {
    const newOwners = [...owners];
    processUnique(newOwners);
    let anyMissing = false;
    newOwners.forEach((owner) => {
      if (!owner.pk) {
        owner.required = true;
        anyMissing = true;
      } else if (!owner.unique) {
        anyMissing = true;
      }
    });
    setOwners(newOwners);
    if (!anyMissing) {
      next();
    }
  }

  function newOwner() {
    const newOwners = [...owners];
    newOwners.push({
      key: ownerKey,
      address: "",
      pk: undefined,
      valid: false,
      required: false,
      unique: false,
    });
    setOwners(newOwners);
    setOwnerKey(ownerKey + 1);
  }

  function removeOwner(index: number) {
    setThreshold(Math.min(threshold, owners.length - 1));
    const newOwners = owners.filter((_, i) => i !== index);
    processUnique(newOwners);
    setOwners(newOwners);
  }

  function processUnique(owners: Owner[]) {
    const seen: (PublicKey | undefined)[] = [];

    owners.forEach((owner, i) => {
      owner.unique = !seen.some(
        (seen, j) => owner.pk && seen && i !== j && seen.equals(owner.pk)
      );
      seen.push(owner.pk);
    });
  }

  function ownerChanged(owner: string, index: number) {
    let valid = false;
    let pk: PublicKey | undefined;
    try {
      if (owner) {
        pk = new PublicKey(owner);
        valid = true;
      }
    } catch {}
    const newOwner: Owner = {
      key: owners[index].key,
      address: owner,
      pk,
      valid,
      required: owners[index].required,
      unique: true,
    };
    let newOwners = [...owners];
    newOwners[index] = newOwner;
    processUnique(newOwners);
    setOwners(newOwners);
  }

  function handleCreate() {}

  return (
    <>
      <PageHeader title="Create new Smart Wallet" />

      <Collapse.Group accordion>
        <Collapse
          arrowIcon={<></>}
          title={
            <Text
              h3
              style={{
                opacity: current === 0 ? 1 : 0.5,
                transition: "opacity 0.25s",
              }}
            >
              Cluster
            </Text>
          }
          expanded={current === 0}
          disabled
          className="collapse-disabled"
        >
          <>
            <Text>Select the cluster to create your Smart Wallet.</Text>

            <WalletMultiButton className="btn btn-ghost mr-4" />

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <Link href={"/welcome"} passHref>
                <Button bordered size="sm" onClick={back}>
                  Cancel
                </Button>
              </Link>
              <Button size="sm" onClick={next}>
                Continue
              </Button>
            </div>
          </>
        </Collapse>
        <Collapse
          arrowIcon={<></>}
          title={
            <Text
              h3
              style={{
                opacity: current === 1 ? 1 : 0.5,
                transition: "opacity 0.25s",
              }}
            >
              Owners
            </Text>
          }
          disabled
          className="collapse-disabled"
          expanded={current === 1}
        >
          <>
            <Text>
              You are about to create a new Smart Wallet with one or multiple
              owners. Add as many owners as required and specify the number of
              signatures required to execute a transaction.
            </Text>
            {owners.map((owner, i) => {
              const error =
                (owner.required && !owner.pk) ||
                !owner.unique ||
                (!owner.valid && owner.address);
              const helperText =
                owner.valid && !owner.unique
                  ? "Address already added"
                  : owner.required
                  ? "Required"
                  : undefined;
              return (
                <div key={owner.key} style={{ marginTop: "15px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Input
                      underlined
                      placeholder="Address"
                      onChange={(event) => ownerChanged(event.target.value, i)}
                      width="100%"
                      aria-label={"Owner " + i}
                      helperColor={error ? "error" : undefined}
                      helperText={helperText}
                      contentRight={
                        owner.valid ? (
                          <Image
                            alt="settings icon"
                            src="/icons/checkmark.svg"
                            width={27}
                            height={27}
                          />
                        ) : undefined
                      }
                    />
                    <Button
                      size="sm"
                      light
                      onClick={() => {
                        removeOwner(i);
                      }}
                      css={{
                        minWidth: 0,
                        visibility: i === 0 ? "hidden" : "visible",
                      }}
                    >
                      <Image
                        alt="delete"
                        src="/icons/delete-icon-gray.svg"
                        width={20}
                        height={20}
                      />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <Button onClick={newOwner} light color="primary">
                Add another owner
              </Button>
            </div>
            <Text h5>Threshold:</Text>
            <Button.Group css={{ userSelect: "none" }}>
              <Button
                disabled={threshold < 2}
                onClick={() => setThreshold(Math.max(threshold - 1, 1))}
              >
                -
              </Button>
              <Button>{threshold}</Button>
              <Button
                disabled={threshold >= owners.length}
                onClick={() =>
                  setThreshold(Math.min(threshold + 1, owners.length))
                }
              >
                +
              </Button>
            </Button.Group>
            <Text>
              Transactions require signatures from {threshold} out of{" "}
              {owners.length} owner(s).
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <Button bordered size="sm" onClick={back}>
                Back
              </Button>
              <Button size="sm" onClick={handleAcceptOwners}>
                Continue
              </Button>
            </div>
          </>
        </Collapse>
        <Collapse
          arrowIcon={<></>}
          title={
            <Text
              h3
              style={{
                opacity: current === 2 ? 1 : 0.5,
                transition: "opacity 0.25s",
              }}
            >
              Review
            </Text>
          }
          disabled
          className="collapse-disabled"
          expanded={current === 2}
        >
          <>
            <Text>Owners</Text>
            <Card>
              <Card.Body css={{ padding: "12px" }}>
                {owners.map((owner, i) => (
                  <Fragment key={owner.key}>
                    {i === 0 && <Divider height={2} />}
                    <div>
                      <Text small>{owner.address}</Text>
                    </div>
                    <Divider height={2} />
                  </Fragment>
                ))}
              </Card.Body>
            </Card>
            <Text>
              You are about to create a new Smart Wallet. Any transaction
              requires the signature of {threshold} out of {owners.length}{" "}
              owners.
            </Text>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <Button bordered size="sm" onClick={back}>
                Back
              </Button>
              <Button size="sm" onClick={handleCreate}>
                Create
              </Button>
            </div>
          </>
        </Collapse>
      </Collapse.Group>
    </>
  );
}