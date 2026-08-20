import { cookies } from "next/headers";
import InteractiveDashboard from "./dashboard/InteractiveDashboard";
import MediaManager from "./dashboard/MediaManager";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAdmin = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);

  return (
    <div className="dashboard-shell">
      <InteractiveDashboard isAdmin={isAdmin} />
      <div className="media-page-wrap">
        <MediaManager isAdmin={isAdmin} />
      </div>
    </div>
  );
}
