export default async function PublicPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <main className="p-6"><h1 className="text-2xl font-bold">@{username}</h1></main>;
}
