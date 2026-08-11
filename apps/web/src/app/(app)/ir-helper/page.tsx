import { redirect } from 'next/navigation';

export default function IRHelperIndexPage() {
  // Redirect to current year
  redirect(`/ir-helper/${new Date().getFullYear()}`);
}
