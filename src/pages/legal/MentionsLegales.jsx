import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/mentions-legales.md?raw";

export default function MentionsLegales() {
  return <LegalPage title="Mentions légales" lastUpdated="17 avril 2025" content={content} />;
}
