export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export function joinInviteUrl(inviteToken: string) {
  return `${appBaseUrl()}/join/${inviteToken}`;
}
