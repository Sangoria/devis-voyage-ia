import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/cookies.md?raw";

export default function Cookies() {
  return <LegalPage title="Politique de cookies" lastUpdated="avril 2026" content={content} />;
}
