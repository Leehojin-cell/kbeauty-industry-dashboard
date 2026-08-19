import { cookies } from "next/headers";
import InteractiveDashboard from "./dashboard/InteractiveDashboard";
import { COOKIE_NAME, verifyAuthToken } from "../lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAdmin = await verifyAuthToken(cookieStore.get(COOKIE_NAME)?.value);
  return <InteractiveDashboard isAdmin={isAdmin} />;
}
