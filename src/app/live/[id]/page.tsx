import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import MeetingRoom from "@/components/MeetingRoom";

export default async function LiveMeetingPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // --- EXPIRY ENFORCEMENT LOGIC ---
  const idParts = params.id.split('-');
  
  if (idParts.length === 4) {
    const expiryTimestamp = parseInt(idParts[3], 10);
    if (expiryTimestamp && Date.now() > expiryTimestamp) {
      return (
        <div className="flex h-[calc(100vh-73px)] w-full flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h1 className="text-3xl font-bold text-rose-500 mb-4">Meeting Expired</h1>
            <p className="text-slate-400 mb-8">This live interview link has expired. Please request a new meeting ID from your recruiter.</p>
            <a href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  // Fetch user data
  const user = await currentUser();
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Guest";
  
  // Check if this user is a recruiter using Clerk metadata (adjust if you check this differently in your DB)
  const isRecruiter = user?.publicMetadata?.role === "recruiter" || false;

  return (
    <div className="flex h-[calc(100vh-73px)] w-full flex-col bg-slate-950">
      <MeetingRoom roomId={params.id} userName={userName} isRecruiter={isRecruiter} />
    </div>
  );
}