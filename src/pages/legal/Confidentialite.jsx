import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/confidentialite.md?raw";

export default function Confidentialite() {
  return <LegalPage title="Politique de confidentialité" lastUpdated="17 avril 2025" content={content} />;
}
