import { cookies } from "next/headers";
import InteractiveDashboard from "./dashboard/InteractiveDashboard";
import MediaManagerBulk from "./dashboard/MediaManagerBulk";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAdmin = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);

  return (
    <div className="dashboard-shell">
      <InteractiveDashboard isAdmin={isAdmin} />
      <div className="media-page-wrap">
        <MediaManagerBulk isAdmin={isAdmin} />
      </div>
    </div>
  );
}
