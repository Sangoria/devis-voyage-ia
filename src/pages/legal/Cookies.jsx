import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/cookies.md?raw";

export default function Cookies() {
  return <LegalPage title="Politique de cookies" lastUpdated="17 avril 2025" content={content} />;
}
