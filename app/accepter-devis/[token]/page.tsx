import AcceptanceClient from "./AcceptanceClient";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function AccepterDevisPage({ params }: Props) {
  const { token } = await params;

  return <AcceptanceClient token={token} />;
}

