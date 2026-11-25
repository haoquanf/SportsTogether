import { addComment, deleteComment, reportComment } from "@/app/groups/actions";
import type { CommentRow } from "@/lib/groups";
import { LAUNCH_TZ } from "@/lib/time";
import { Avatar } from "./avatar";
import { CommentForm } from "./comment-form";
import { ReportButton } from "./report-button";

export function Comments({
  comments,
  groupId,
  eventId = null,
  userId,
  canPost,
  isAdmin,
  path,
}: {
  comments: CommentRow[];
  groupId: string;
  eventId?: string | null;
  userId: string;
  canPost: boolean;
  isAdmin: boolean;
  path: string;
}) {
  return (
    <section className="card">
      <h2 className="mb-4 text-lg font-semibold">Comments</h2>
      {comments.length === 0 && <p className="mb-4 text-sm text-slate-500">No comments yet.</p>}
      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar name={c.profiles?.display_name ?? "?"} url={c.profiles?.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{c.profiles?.display_name ?? "Member"}</span>{" "}
                <span className="text-slate-400">
                  {new Date(c.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: LAUNCH_TZ })}
                </span>
              </p>
              <p className="whitespace-pre-wrap break-words text-slate-800">{c.body}</p>
              <div className="mt-1 flex gap-3 text-xs text-slate-500">
                {(c.user_id === userId || isAdmin) && (
                  <form action={deleteComment.bind(null, c.id, path)}>
                    <button className="hover:text-red-600">Delete</button>
                  </form>
                )}
                {c.user_id !== userId && <ReportButton action={reportComment.bind(null, c.id, c.user_id)} />}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {canPost ? (
        <CommentForm action={addComment.bind(null, groupId, eventId)} />
      ) : (
        <p className="mt-4 text-sm text-slate-500">Join the group to comment.</p>
      )}
    </section>
  );
}
