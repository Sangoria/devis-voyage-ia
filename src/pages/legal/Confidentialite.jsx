import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/confidentialite.md?raw";

export default function Confidentialite() {
  return <LegalPage title="Politique de confidentialité" lastUpdated="avril 2026" content={content} />;
}
