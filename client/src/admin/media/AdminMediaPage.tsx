import { MediaLibrary } from "./MediaLibrary";
import { MediaUploader } from "./MediaUploader";

/** /admin/media — everything in the uploads folder: add new files, browse,
    search, see where each is used, delete. */
export function AdminMediaPage() {
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">Media</h1>
      <div className="mt-4">
        <MediaUploader />
      </div>
      <div className="mt-6">
        <MediaLibrary mode="manage" />
      </div>
    </div>
  );
}
