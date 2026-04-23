import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/mentions-legales.md?raw";

export default function MentionsLegales() {
  return <LegalPage title="Mentions légales" lastUpdated="avril 2026" content={content} />;
}
