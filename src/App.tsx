import { AppShell } from "./components/layout/AppShell";
import { NoteList } from "./features/notes/NoteList";
import { EditorPage } from "./features/editor/EditorPage";
import { PreviewPage } from "./features/preview/PreviewPage";
import { SearchDialog } from "./features/search/SearchDialog";
import { SettingsPage } from "./features/settings/SettingsPage";
import { RecycleBin } from "./features/recycle/RecycleBin";
import { CalendarView } from "./features/calendar/CalendarView";
import { LoginPage } from "./features/auth/LoginPage";
import { ProfilePage } from "./features/auth/ProfilePage";
import { useUiStore } from "./stores/uiStore";

function App() {
  const { editingNoteId, currentNoteId, viewMode, currentPage } = useUiStore();

  const renderPage = () => {
    if (editingNoteId) return <EditorPage />;
    if (currentNoteId) return <PreviewPage />;

    switch (currentPage) {
      case "settings": return <SettingsPage />;
      case "recycle": return <RecycleBin />;
      case "login": return <LoginPage />;
      case "profile": return <ProfilePage />;
      default:
        if (viewMode === "calendar") return <CalendarView />;
        return <NoteList />;
    }
  };

  return (
    <div className="h-screen">
      {renderPage()}
      <SearchDialog />
    </div>
  );
}

export default App;