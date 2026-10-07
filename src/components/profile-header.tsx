import type { PublicProfile } from "../../convex/lib/access";
import { ShareButton } from "./share-button";

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const imageUrl = profile.imageUrl?.startsWith("https://") ? profile.imageUrl : undefined;
  return <section className="card space-y-3">
    {imageUrl ? (
      // Clerk avatars have dynamic hosts; only HTTPS URLs are rendered.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" width={64} height={64} referrerPolicy="no-referrer" className="rounded-full" />
    ) : <span aria-hidden="true" className="text-3xl">○</span>}
    <h1 className="text-2xl font-bold">{profile.displayName}</h1>
    <p>@{profile.username}</p>
    {profile.bio && <p className="whitespace-pre-wrap">{profile.bio}</p>}
    <ShareButton username={profile.username} />
  </section>;
}
