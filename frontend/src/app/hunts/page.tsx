import type { Metadata } from "next";
import { HuntList } from "../../components/hunt/HuntList";

export const metadata: Metadata = {
  title: "Hunts",
  description: "Browse and manage your treasure hunts",
};

export default function HuntsPage() {
  return <HuntList />;
}
