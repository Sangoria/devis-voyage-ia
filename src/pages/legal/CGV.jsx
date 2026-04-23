import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/cgv.md?raw";

export default function CGV() {
  return <LegalPage title="Conditions générales de vente" lastUpdated="avril 2026" content={content} />;
}
