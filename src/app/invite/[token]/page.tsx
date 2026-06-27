"use client";

import InviteAcceptForm from "./InviteAcceptForm";

type InvitePageProps = {
  params: {
    token: string;
  };
};

export default function InvitePage({ params }: InvitePageProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <InviteAcceptForm token={params.token} />
    </div>
  );
}
