import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  // Redirect pengguna langsung ke halaman login
  redirect("/login");
}
